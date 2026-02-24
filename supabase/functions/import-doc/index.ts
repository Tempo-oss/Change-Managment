import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Required CORS headers so your frontend can call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight Requests from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, type } = await req.json()

    if (!url || type !== 'confluence') {
        throw new Error("Invalid request. Currently only Confluence URLs are supported.");
    }

    // 1. Authentication Details
    // Replace the placeholder below with the email address you use to log into Atlassian.
    const email = Deno.env.get('ATLASSIAN_EMAIL') || 'mohamed.abdelmagid@tempo.fit'; 
    const apiToken = Deno.env.get('ATLASSIAN_API_TOKEN') || "ATATTDeno.env.get('ATLASSIAN_API_TOKEN');3xFfGF0le_f5HEl4KVGK5wHkz_4kKlboVAjmqrfVQukMWUPwmkIlobKtxxN2SNwa5PI9SMnXmmv9jVzLRr5Y84dRT9Qkm1La3RRL3nAycLS-ELtR-Zzc5oXpnIFS2YOSKCV7KA-yFw3ATprzv2L0kWOZKiUA9YIiYJV7AHE0Bu_Gm_XgbQ=B46844EA";
    const domain = "tempofit.atlassian.net";
    if (!email || !apiToken) {
        throw new Error("Atlassian credentials missing in Edge Function secrets.");
    }

    // 2. Extract the Page ID from the URL string
    // Confluence URLs usually look like: /wiki/spaces/SPACE/pages/12345678/Page+Title
    const pageIdMatch = url.match(/\/pages\/(\d+)/);
    const pageId = pageIdMatch ? pageIdMatch[1] : null;

    if (!pageId) {
        throw new Error("Could not extract Confluence Page ID from the URL.");
    }

    // 3. Make the API Call to Atlassian API to get the page body
    const authHeader = `Basic ${btoa(`${email}:${apiToken}`)}`;
    const confluenceRes = await fetch(`https://${domain}/wiki/rest/api/content/${pageId}?expand=body.storage`, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
        }
    });

    if (!confluenceRes.ok) {
        throw new Error(`Confluence API returned ${confluenceRes.status}`);
    }

    const confluenceData = await confluenceRes.json();
    const rawHtmlBody = confluenceData.body.storage.value;

    // 4. PARSING LOGIC 
    // In a real production app, you might pass `rawHtmlBody` into an LLM (like OpenAI or Gemini) 
    // here on the backend to automatically summarize the text into your specific form fields.
    // For this demonstration, we'll manually simulate the extracted data.

    const extractedData = {
        title: confluenceData.title || "Imported Project Title",
        objective: "Parsed objective from the Confluence body...",
        scope: "Parsed scope from the Confluence body...",
        techSummary: "Parsed tech summary from the Confluence body...",
        dependencies: "Parsed dependencies from the Confluence body..."
    };

    // 5. Return the parsed data to your Frontend
    return new Response(
      JSON.stringify({ success: true, parsed: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})