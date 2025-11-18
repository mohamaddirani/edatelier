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
  Category: ${d.category || 'N/A'} | Color: ${d.color || 'N/A'}
  Condition: ${d.condition || 'N/A'} | Price: ${d.price_per_day ? `$${d.price_per_day}/day` : 'Contact for pricing'}
  Description: ${d.description || 'No description'}
  LINK: https://08f5f13e-11b4-427a-b732-7f565abfa343.lovableproject.com/dress/${d.id}`
        ).join('\n\n')}\n\nWhen recommending dresses, present them in a beautiful, simple format using this EXACT structure for EACH dress:
**[Dress Name]** - [Brief 1-sentence appeal about the dress]
VIEWDRESS:https://08f5f13e-11b4-427a-b732-7f565abfa343.lovableproject.com/dress/[id]

Do NOT include: dress ID, detailed descriptions, size info, or category/condition details in the recommendation. Keep it elegant and simple.`
      : '\n\nCurrently no dresses are available in our inventory. Please apologize and ask the customer to check back soon or contact us directly.';

    const systemPrompt = `You are an expert fashion consultant for ED ATELIER, a luxury dress rental boutique. Your role is to help customers find their perfect dress with warmth and elegance.

Key facts:
- ALL our dresses are fully resizable - size is NEVER an issue
- We offer elegant designer dresses in various styles, colors, and conditions
- Our designer Enaam can adjust any dress or create custom pieces

Conversation flow:
1. Warmly greet and ask about their special occasion
2. Ask about style preference (elegant, modern, classic, bold, etc.)
3. Ask about color preference
4. Recommend 2-3 dresses that match their style and color

${dressContext}

CRITICAL FORMATTING RULES:
- Keep responses warm, concise, and conversational - no lengthy explanations
- When recommending dresses, use this EXACT format for each:
  **[Dress Name]** - [One appealing sentence about the dress]
  VIEWDRESS:https://08f5f13e-11b4-427a-b732-7f565abfa343.lovableproject.com/dress/[id]
- After dress recommendations, add: "All dresses can be perfectly tailored to your size. Contact Enaam for adjustments or custom designs: https://api.whatsapp.com/send?phone=9613836748"
- If no dresses match style/color: "We can create something custom for you! Contact Enaam: https://api.whatsapp.com/send?phone=9613836748"
- NEVER mention size as a limitation - all dresses are resizable
- NEVER show dress IDs, categories, conditions, or lengthy descriptions
- Keep it elegant and simple`;

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
