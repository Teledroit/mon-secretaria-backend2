import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PurchaseRequest {
  phoneNumber: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { phoneNumber }: PurchaseRequest = await req.json();

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
    const webhookUrl = `${SUPABASE_URL}/functions/v1/twilio-webhook`;

    console.log('Purchasing phone number:', phoneNumber);
    console.log('Webhook URL:', webhookUrl);

    // Purchase the phone number via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;

    const formData = new URLSearchParams();
    formData.append('PhoneNumber', phoneNumber);
    formData.append('VoiceUrl', webhookUrl);
    formData.append('VoiceMethod', 'POST');
    formData.append('StatusCallback', `${SUPABASE_URL}/functions/v1/twilio-webhook`);
    formData.append('StatusCallbackMethod', 'POST');

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
          errorMessage = "Votre compte Twilio est en mode test et ne peut pas acheter de numéros réels. Veuillez mettre à niveau votre compte Twilio vers un compte de production avec facturation activée pour utiliser cette fonctionnalité.";
          errorDetails = {
            code: errorData.code,
            requiresUpgrade: true,
            twilioDocsUrl: errorData.more_info || "https://www.twilio.com/console"
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

    // Get or create Twilio account for user
    const { data: twilioAccount, error: accountError } = await supabaseClient
      .from('twilio_accounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let accountId = twilioAccount?.id;

    if (!accountId) {
      const { data: newAccount, error: createError } = await supabaseClient
        .from('twilio_accounts')
        .insert({
          user_id: user.id,
          account_sid: TWILIO_ACCOUNT_SID,
          auth_token: TWILIO_AUTH_TOKEN,
          status: 'active',
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating Twilio account:', createError);
        throw new Error('Échec de la création du compte Twilio');
      }

      accountId = newAccount.id;
    }

    // Save the phone number to database
    const { error: phoneError } = await supabaseClient
      .from('twilio_phone_numbers')
      .insert({
        account_id: accountId,
        phone_number: purchasedNumber.phone_number,
        friendly_name: purchasedNumber.friendly_name || purchasedNumber.phone_number,
        status: 'active',
      });

    if (phoneError) {
      console.error('Error saving phone number:', phoneError);
      throw new Error('Échec de l\'enregistrement du numéro');
    }

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