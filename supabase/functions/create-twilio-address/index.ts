import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AddressRequest {
  customerName: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
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

    const addressData: AddressRequest = await req.json();

    // Validate required fields
    if (!addressData.customerName || !addressData.street || !addressData.city ||
        !addressData.region || !addressData.postalCode || !addressData.country) {
      throw new Error('Tous les champs de l\'adresse sont requis');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Configuration Twilio manquante');
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    console.log('Creating address with Twilio:', {
      customerName: addressData.customerName,
      city: addressData.city,
      country: addressData.country
    });

    // Create address with Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Addresses.json`;

    const formData = new URLSearchParams();
    formData.append('CustomerName', addressData.customerName);
    formData.append('Street', addressData.street);
    formData.append('City', addressData.city);
    formData.append('Region', addressData.region);
    formData.append('PostalCode', addressData.postalCode);
    formData.append('IsoCountry', addressData.country);

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
      console.error('Twilio address creation error:', response.status, errorText);

      let errorMessage = `Échec de la création de l'adresse: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
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

    const twilioAddress = await response.json();

    console.log('Address created successfully with Twilio:', twilioAddress.sid);

    // Check if this is the first address for the user
    const { data: existingAddresses, error: checkError } = await supabaseClient
      .from('twilio_addresses')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing addresses:', checkError);
    }

    // If this is the first address, make it default automatically
    const isDefault = addressData.isDefault ?? (existingAddresses?.length === 0);

    // Save the address to database
    const { data: savedAddress, error: saveError } = await supabaseClient
      .from('twilio_addresses')
      .insert({
        user_id: user.id,
        address_sid: twilioAddress.sid,
        customer_name: addressData.customerName,
        street: addressData.street,
        city: addressData.city,
        region: addressData.region,
        postal_code: addressData.postalCode,
        country: addressData.country,
        is_default: isDefault,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving address:', saveError);
      throw new Error('Échec de l\'enregistrement de l\'adresse');
    }

    return new Response(
      JSON.stringify({
        success: true,
        address: savedAddress,
        message: 'Adresse créée avec succès',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error creating address:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue lors de la création de l\'adresse',
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
