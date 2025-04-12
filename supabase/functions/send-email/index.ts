import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// TODO: Replace with your actual Resend API Key stored in Supabase Secrets
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com' // Set a default or get from secrets

console.log('send-email function initialized');

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()
    console.log(`Received request to send email to: ${to}, subject: ${subject}`);

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables.');
      return new Response(JSON.stringify({ error: 'Internal server error: Email API key missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!to || !subject || !html) {
      console.error('Missing required parameters: to, subject, or html');
      return new Response(JSON.stringify({ error: 'Missing required parameters: to, subject, or html' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Attempting to send email via Resend from: ${RESEND_FROM_EMAIL}`);
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: to,
        subject: subject,
        html: html,
      }),
    })

    const responseData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', responseData);
      // Propagate Resend's error message if available
      const errorMessage = responseData?.message || 'Failed to send email via Resend'
      return new Response(JSON.stringify({ error: errorMessage, details: responseData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: resendResponse.status,
      })
    }

    console.log('Email sent successfully via Resend:', responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 