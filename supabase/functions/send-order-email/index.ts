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
    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid order ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order with dress info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, dresses(name, purchase_price, image_url)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true, emailSent: false, reason: "Email service not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dressName = order.dresses?.name || 'Unknown Item';
    const price = order.total_price || order.dresses?.purchase_price || 0;

    // Email to customer
    const customerHtml = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; text-align: center; font-size: 28px;">ED ATELIER</h1>
        <hr style="border: 1px solid #e5e5e5; margin: 20px 0;" />
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Dear ${order.customer_name},</p>
        <p>Thank you for your order! Here are the details:</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Item:</strong> ${dressName}</p>
          <p><strong>Size:</strong> ${order.selected_size}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Total:</strong> $${price}</p>
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
        </div>
        <p><strong>Shipping Address:</strong> ${order.customer_address}</p>
        <p>We will process your order shortly. You'll be contacted at ${order.customer_phone} for delivery updates.</p>
        <hr style="border: 1px solid #e5e5e5; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">ED ATELIER - Luxury Fashion</p>
      </div>
    `;

    // Email to admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d32f2f;">🛒 New Order Received!</h1>
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800;">
          <h3>Order #${order.id.slice(0, 8)}</h3>
          <p><strong>Item:</strong> ${dressName}</p>
          <p><strong>Size:</strong> ${order.selected_size}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Total:</strong> $${price}</p>
        </div>
        <h3>Customer Details</h3>
        <ul>
          <li><strong>Name:</strong> ${order.customer_name}</li>
          <li><strong>Email:</strong> ${order.customer_email}</li>
          <li><strong>Phone:</strong> ${order.customer_phone}</li>
          <li><strong>Address:</strong> ${order.customer_address}</li>
          ${order.notes ? `<li><strong>Notes:</strong> ${order.notes}</li>` : ''}
        </ul>
        <p>Go to the admin dashboard to manage this order.</p>
      </div>
    `;

    const emailPromises = [];

    // Send to customer
    emailPromises.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ED ATELIER <onboarding@resend.dev>',
          to: [order.customer_email],
          subject: `Order Confirmation - ${dressName}`,
          html: customerHtml,
        }),
      })
    );

    // Send to admin
    if (ADMIN_EMAIL) {
      emailPromises.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ED ATELIER Orders <onboarding@resend.dev>',
            to: [ADMIN_EMAIL],
            subject: `New Order: ${dressName} - ${order.customer_name}`,
            html: adminHtml,
          }),
        })
      );
    }

    const results = await Promise.allSettled(emailPromises);
    const allSent = results.every(r => r.status === 'fulfilled' && (r.value as Response).ok);

    return new Response(
      JSON.stringify({ success: true, emailSent: allSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
