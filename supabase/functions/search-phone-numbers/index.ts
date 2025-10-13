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

// Map country codes and phone prefixes to Twilio country codes
const COUNTRY_MAPPING: Record<string, string> = {
  // Phone prefixes
  '+33': 'FR',
  '+34': 'ES',
  '+49': 'DE',
  '+39': 'IT',
  '+351': 'PT',
  '+31': 'NL',
  '+32': 'BE',
  '+41': 'CH',
  '+46': 'SE',
  '+48': 'PL',
  '+44': 'GB',
  '+1': 'US',
  // ISO codes
  'FR': 'FR',
  'ES': 'ES',
  'DE': 'DE',
  'IT': 'IT',
  'PT': 'PT',
  'NL': 'NL',
  'BE': 'BE',
  'CH': 'CH',
  'SE': 'SE',
  'PL': 'PL',
  'GB': 'GB',
  'UK': 'GB',
  'US': 'US',
  'CA': 'CA',
};

function detectCountry(query: string): { country: string; cleanQuery: string } {
  const trimmed = query.trim().toUpperCase();
  
  // Check if query starts with a phone prefix
  for (const [prefix, country] of Object.entries(COUNTRY_MAPPING)) {
    if (prefix.startsWith('+') && trimmed.startsWith(prefix)) {
      return { country, cleanQuery: trimmed.substring(prefix.length).trim() };
    }
  }
  
  // Check if query is a country code (2 letters)
  if (trimmed.length === 2 && COUNTRY_MAPPING[trimmed]) {
    return { country: COUNTRY_MAPPING[trimmed], cleanQuery: '' };
  }
  
  // Check if query starts with a country code followed by space or comma
  const firstWord = trimmed.split(/[\s,]+/)[0];
  if (firstWord.length === 2 && COUNTRY_MAPPING[firstWord]) {
    return { country: COUNTRY_MAPPING[firstWord], cleanQuery: trimmed.substring(2).trim() };
  }
  
  // Default to France
  return { country: 'FR', cleanQuery: query.trim() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { searchQuery = '', country }: SearchRequest = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Configuration Twilio manquante');
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Detect country from query if not explicitly provided
    let targetCountry = country || 'FR';
    let cleanQuery = searchQuery;
    
    if (!country && searchQuery) {
      const detected = detectCountry(searchQuery);
      targetCountry = detected.country;
      cleanQuery = detected.cleanQuery;
      console.log(`Detected country: ${targetCountry}, clean query: "${cleanQuery}"`);
    }

    // Build query parameters
    const params = new URLSearchParams();

    // Handle different search types for the clean query
    if (cleanQuery && cleanQuery.trim()) {
      // Check if it's a number (area code)
      if (/^\d+$/.test(cleanQuery.trim())) {
        params.append('AreaCode', cleanQuery.trim());
      } else {
        // It's a city name
        params.append('InLocality', cleanQuery.trim());
      }
    }

    params.append('Limit', '20');

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${targetCountry}/Local.json?${params.toString()}`;

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
        } else if (errorData.code === 21452) {
          errorMessage = `Aucun numéro disponible pour le pays ${targetCountry}. Twilio ne propose peut-être pas de numéros dans ce pays.`;
          errorDetails = { code: errorData.code };
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
      location: number.locality || number.region || targetCountry,
      type: 'local',
      price: 1,
      capabilities: number.capabilities,
    }));

    console.log(`Found ${formattedNumbers.length} available numbers for ${targetCountry}`);

    return new Response(
      JSON.stringify({
        success: true,
        numbers: formattedNumbers,
        count: formattedNumbers.length,
        country: targetCountry,
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
