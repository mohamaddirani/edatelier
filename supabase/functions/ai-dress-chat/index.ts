import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to fetch dress inventory
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch available dresses from the database
    const { data: dresses, error: dbError } = await supabase
      .from('dresses')
      .select('id, name, description, category, color, size, condition, price_per_day, image_url')
      .eq('is_available', true);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Build dress catalog for AI context
    const dressContext = dresses && dresses.length > 0 
      ? `\n\nAVAILABLE DRESSES IN OUR COLLECTION:\n${dresses.map(d => 
          `- ${d.name} (ID: ${d.id})
  Category: ${d.category || 'N/A'} | Color: ${d.color || 'N/A'} | Size: ${d.size || 'N/A'}
  Condition: ${d.condition || 'N/A'} | Price: ${d.price_per_day ? `$${d.price_per_day}/day` : 'Contact for pricing'}
  Description: ${d.description || 'No description'}
  View: https://08f5f13e-11b4-427a-b732-7f565abfa343.lovableproject.com/dress/${d.id}`
        ).join('\n\n')}\n\nWhen a customer provides their preferences, recommend 2-3 specific dresses from the above list that match their criteria. Always include the dress name and provide the link so they can view it.`
      : '\n\nCurrently no dresses are available in our inventory. Please apologize and ask the customer to check back soon or contact us directly.';

    const systemPrompt = `You are an expert fashion consultant for ED ATELIER, a luxury dress rental service. Your role is to help customers find the perfect dress for their special occasion.

Key information about ED ATELIER:
- We offer elegant designer dresses for rent
- Dresses come in various colors, styles, and conditions (new or used)
- Each dress has unique characteristics and pricing
- We specialize in high-quality, sophisticated pieces

Your approach:
1. Ask about the customer's event (wedding, gala, cocktail party, etc.)
2. Inquire about style preferences (elegant, bold, classic, modern, etc.)
3. Ask about color preferences
4. Inquire about size requirements
5. Once you have their preferences, IMMEDIATELY recommend 2-3 specific dresses from our collection below that match their needs

${dressContext}

Be warm, professional, and enthusiastic. Help customers feel confident in their choice. Keep responses concise and conversational. ALWAYS provide actual dress recommendations with links when you have the customer's preferences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact support." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
