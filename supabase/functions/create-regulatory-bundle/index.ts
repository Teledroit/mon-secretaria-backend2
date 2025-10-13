import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BundleRequest {
  addressSid: string;
  friendlyName?: string;
}

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

    const { addressSid, friendlyName }: BundleRequest = await req.json();

    if (!addressSid) {
      throw new Error('AddressSid requis');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Configuration Twilio manquante');
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // France regulation SID (this is a standard Twilio SID for France)
    const FRANCE_REGULATION_SID = 'RN0a0c76f8ad27f7e3ab0ba5f0d386674a';

    console.log('Creating regulatory bundle for address:', addressSid);

    // Step 1: Create the bundle
    const bundleUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles`;
    const bundleData = new URLSearchParams();
    bundleData.append('FriendlyName', friendlyName || `Bundle-${user.id.substring(0, 8)}`);
    bundleData.append('Email', user.email || '');
    bundleData.append('RegulationSid', FRANCE_REGULATION_SID);
    bundleData.append('EndUserType', 'individual');
    bundleData.append('IsoCountry', 'FR');
    bundleData.append('NumberType', 'local');

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
      console.error('Twilio bundle creation error:', bundleResponse.status, errorText);
      throw new Error(`Échec de la création du bundle: ${bundleResponse.status}`);
    }

    const bundle = await bundleResponse.json();
    console.log('Bundle created:', bundle.sid);

    // Step 2: Assign the address to the bundle
    const assignUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundle.sid}/ItemAssignments`;
    const assignData = new URLSearchParams();
    assignData.append('ObjectSid', addressSid);

    const assignResponse = await fetch(assignUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: assignData.toString(),
    });

    if (!assignResponse.ok) {
      const errorText = await assignResponse.text();
      console.error('Twilio address assignment error:', assignResponse.status, errorText);
      // Don't fail completely, just log the error
      console.log('Warning: Could not assign address to bundle, continuing...');
    } else {
      console.log('Address assigned to bundle successfully');
    }

    // Step 3: Submit the bundle for review
    const submitUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundle.sid}`;
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

    let finalStatus = bundle.status || 'draft';
    if (submitResponse.ok) {
      const submitResult = await submitResponse.json();
      finalStatus = submitResult.status;
      console.log('Bundle submitted for review, status:', finalStatus);
    } else {
      console.log('Warning: Could not submit bundle for review, keeping as draft');
    }

    // Save the bundle to database
    const { data: savedBundle, error: saveError } = await supabaseClient
      .from('twilio_regulatory_bundles')
      .insert({
        user_id: user.id,
        bundle_sid: bundle.sid,
        address_sid: addressSid,
        status: finalStatus,
        friendly_name: bundle.friendly_name,
        regulation_sid: FRANCE_REGULATION_SID,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving bundle:', saveError);
      throw new Error('Échec de l\'enregistrement du bundle');
    }

    return new Response(
      JSON.stringify({
        success: true,
        bundle: savedBundle,
        message: 'Bundle réglementaire créé avec succès',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error creating regulatory bundle:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue lors de la création du bundle',
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
