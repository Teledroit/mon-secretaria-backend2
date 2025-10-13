import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PurchaseRequest {
  phoneNumber: string;
  addressSid?: string;
}

// Countries that require regulatory bundles
const COUNTRIES_REQUIRING_BUNDLE = ['FR'];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { phoneNumber, addressSid }: PurchaseRequest = await req.json();

    if (!phoneNumber) {
      throw new Error('Numéro de téléphone requis');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !SUPABASE_URL) {
      throw new Error('Configuration manquante');
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Detect if this is a French number (starts with +33)
    const isFrenchNumber = phoneNumber.startsWith('+33');
    
    let finalAddressSid = addressSid;
    let bundleSid = null;

    // Only handle address and bundle for French numbers
    if (isFrenchNumber) {
      console.log('French number detected, handling address and bundle...');

      if (!finalAddressSid) {
        const { data: defaultAddress } = await supabaseClient
          .from('twilio_addresses')
          .select('address_sid')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (defaultAddress) {
          finalAddressSid = defaultAddress.address_sid;
          console.log('Using default address:', finalAddressSid);
        }
      }

      if (!finalAddressSid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Pour acheter un numéro français, vous devez d\'abord ajouter une adresse.',
            details: {
              requiresAddress: true,
            },
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Check if user has an existing approved bundle for this address
      const { data: existingBundle } = await supabaseClient
        .from('twilio_regulatory_bundles')
        .select('bundle_sid, status')
        .eq('user_id', user.id)
        .eq('address_sid', finalAddressSid)
        .maybeSingle();

      bundleSid = existingBundle?.bundle_sid;

      // If bundle exists, check its status with Twilio
      if (bundleSid) {
        const bundleStatusUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundleSid}`;
        const statusResponse = await fetch(bundleStatusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        });

        if (statusResponse.ok) {
          const bundleData = await statusResponse.json();
          console.log('Bundle status:', bundleData.status);

          // Update status in database
          await supabaseClient
            .from('twilio_regulatory_bundles')
            .update({ status: bundleData.status })
            .eq('bundle_sid', bundleSid);

          // If bundle is not approved yet, inform user
          if (bundleData.status !== 'twilio-approved' && bundleData.status !== 'approved') {
            return new Response(
              JSON.stringify({
                success: false,
                error: `Votre bundle réglementaire est en cours de validation (statut: ${bundleData.status}). Cela prend généralement 2-3 minutes. Veuillez réessayer dans quelques instants.`,
                details: {
                  requiresWait: true,
                  bundleStatus: bundleData.status,
                },
              }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                },
              }
            );
          }
        }
      }

      // If no bundle exists, create and submit a new one
      if (!bundleSid) {
        console.log('Creating new regulatory bundle...');
        
        try {
          const regulationsUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Regulations?IsoCountry=FR&NumberType=local`;
          const regulationsResponse = await fetch(regulationsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
            },
          });

          let regulationSid = 'RN0a0c76f8ad27f7e3ab0ba5f0d386674a';

          if (regulationsResponse.ok) {
            const regulations = await regulationsResponse.json();
            if (regulations.results && regulations.results.length > 0) {
              regulationSid = regulations.results[0].sid;
            }
          }

          // Step 1: Create bundle
          const bundleUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles`;
          const bundleData = new URLSearchParams();
          bundleData.append('FriendlyName', `Bundle-${user.id.substring(0, 8)}`);
          bundleData.append('Email', user.email || '');
          bundleData.append('RegulationSid', regulationSid);
          bundleData.append('EndUserType', 'individual');
          bundleData.append('IsoCountry', 'FR');

          const bundleResponse = await fetch(bundleUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bundleData.toString(),
          });

          if (!bundleResponse.ok) {
            const errorText = await bundleResponse.text();
            console.error('Bundle creation error:', bundleResponse.status, errorText);
            throw new Error('Failed to create bundle');
          }

          const bundle = await bundleResponse.json();
          bundleSid = bundle.sid;
          console.log('Bundle created:', bundleSid);

          // Step 2: Assign address to bundle
          const assignUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundleSid}/ItemAssignments`;
          const assignData = new URLSearchParams();
          assignData.append('ObjectSid', finalAddressSid);

          const assignResponse = await fetch(assignUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: assignData.toString(),
          });

          if (!assignResponse.ok) {
            console.error('Address assignment failed:', await assignResponse.text());
          } else {
            console.log('Address assigned to bundle');
          }

          // Step 3: SUBMIT bundle for review (THIS IS THE CRITICAL STEP)
          const submitUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundleSid}`;
          const submitData = new URLSearchParams();
          submitData.append('Status', 'pending-review');

          const submitResponse = await fetch(submitUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: submitData.toString(),
          });

          if (!submitResponse.ok) {
            console.error('Bundle submission failed:', await submitResponse.text());
          } else {
            console.log('Bundle submitted for review');
          }

          // Save to database
          await supabaseClient
            .from('twilio_regulatory_bundles')
            .insert({
              user_id: user.id,
              bundle_sid: bundleSid,
              address_sid: finalAddressSid,
              status: 'pending-review',
              friendly_name: bundle.friendly_name,
              regulation_sid: regulationSid,
            });

          // Inform user to wait
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Votre bundle réglementaire a été soumis pour validation. Cela prend généralement 2-3 minutes. Veuillez réessayer dans quelques instants.',
              details: {
                requiresWait: true,
                bundleSid: bundleSid,
                message: 'Le bundle vient d\'être créé et soumis. Patience...',
              },
            }),
            {
              status: 202,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );

        } catch (bundleError: any) {
          console.error('Bundle creation/submission failed:', bundleError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Erreur lors de la création du bundle réglementaire. Contactez le support.',
              details: {
                error: bundleError.message,
              },
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }
    } else {
      console.log('Non-French number, no bundle required');
    }

    console.log('Purchasing phone number:', phoneNumber);
    if (bundleSid) {
      console.log('Using bundle:', bundleSid);
    }

    const webhookUrl = `${SUPABASE_URL}/functions/v1/twilio-webhook`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;

    const formData = new URLSearchParams();
    formData.append('PhoneNumber', phoneNumber);
    formData.append('VoiceUrl', webhookUrl);
    formData.append('VoiceMethod', 'POST');
    formData.append('StatusCallback', `${SUPABASE_URL}/functions/v1/twilio-webhook`);
    formData.append('StatusCallbackMethod', 'POST');
    
    // Only add AddressSid and BundleSid for French numbers
    if (isFrenchNumber && finalAddressSid) {
      formData.append('AddressSid', finalAddressSid);
    }
    if (bundleSid) {
      formData.append('BundleSid', bundleSid);
    }

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio purchase error:', response.status, errorText);

      let errorMessage = `Échec de l'achat du numéro: ${response.status}`;
      let errorDetails = null;

      try {
        const errorData = JSON.parse(errorText);

        if (errorData.code === 20008 || response.status === 403) {
          errorMessage = "Votre compte Twilio est en mode test. Veuillez mettre à niveau votre compte vers un compte de production.";
          errorDetails = {
            code: errorData.code,
            requiresUpgrade: true,
            twilioDocsUrl: errorData.more_info || "https://www.twilio.com/console"
          };
        } else if (errorData.code === 21608 || errorData.message?.includes('Address')) {
          errorMessage = "Ce numéro nécessite une adresse. Veuillez ajouter une adresse dans 'Gestion des adresses'.";
          errorDetails = {
            code: errorData.code,
            requiresAddress: true,
          };
        } else if (errorData.code === 21211 || errorData.message?.includes('Bundle')) {
          errorMessage = "Le bundle réglementaire n'est pas encore approuvé. Patientez 2-3 minutes et réessayez.";
          errorDetails = {
            code: errorData.code,
            requiresWait: true,
          };
        } else if (errorData.message) {
          errorMessage = errorData.message;
          errorDetails = { code: errorData.code };
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: errorDetails,
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const purchasedNumber = await response.json();
    console.log('Number purchased successfully:', purchasedNumber);

    const { data: twilioAccount } = await supabaseClient
      .from('twilio_accounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let accountId = twilioAccount?.id;

    if (!accountId) {
      const { data: newAccount } = await supabaseClient
        .from('twilio_accounts')
        .insert({
          user_id: user.id,
          account_sid: TWILIO_ACCOUNT_SID,
          auth_token: TWILIO_AUTH_TOKEN,
          status: 'active',
        })
        .select('id')
        .single();

      accountId = newAccount.id;
    }

    await supabaseClient
      .from('twilio_phone_numbers')
      .insert({
        account_id: accountId,
        phone_number: purchasedNumber.phone_number,
        friendly_name: purchasedNumber.friendly_name || purchasedNumber.phone_number,
        status: 'active',
      });

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumber: purchasedNumber.phone_number,
        sid: purchasedNumber.sid,
        message: 'Numéro acheté avec succès',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error purchasing phone number:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue lors de l\'achat',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
