import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  searchQuery?: string;
  country?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { searchQuery = '', country = 'FR' }: SearchRequest = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Configuration Twilio manquante');
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Build query parameters
    const params = new URLSearchParams();

    // Handle different search types
    if (searchQuery) {
      // Check if it's a city name or area code
      if (/^\d+$/.test(searchQuery)) {
        // It's a number (area code)
        params.append('AreaCode', searchQuery);
      } else {
        // It's a city name
        params.append('InLocality', searchQuery);
      }
    }

    params.append('Limit', '20');

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${country}/Local.json?${params.toString()}`;

    console.log('Searching Twilio for numbers:', twilioUrl);

    const response = await fetch(twilioUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', response.status, errorText);

      let errorMessage = `Erreur de l'API Twilio: ${response.status}`;
      let errorDetails = null;

      try {
        const errorData = JSON.parse(errorText);

        if (errorData.code === 20008 || response.status === 403) {
          errorMessage = "Votre compte Twilio est en mode test et ne peut pas rechercher de numéros réels. Veuillez mettre à niveau votre compte Twilio vers un compte de production avec facturation activée pour utiliser cette fonctionnalité.";
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
          numbers: [],
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

    const data = await response.json();

    const formattedNumbers = (data.available_phone_numbers || []).map((number: any) => ({
      number: number.phone_number,
      location: number.locality || number.region || 'France',
      type: 'local',
      price: 1,
      capabilities: number.capabilities,
    }));

    console.log(`Found ${formattedNumbers.length} available numbers`);

    return new Response(
      JSON.stringify({
        success: true,
        numbers: formattedNumbers,
        count: formattedNumbers.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error searching phone numbers:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue lors de la recherche',
        numbers: [],
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