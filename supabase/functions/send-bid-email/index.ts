import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, investorName, startupName, status, rejectionReason } = await req.json()

    if (!to || !investorName || !startupName || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isAccepted = status === 'accepted'
    const appUrl = Deno.env.get('APP_URL') || 'https://yourdomain.com'
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'

    const subject = isAccepted
      ? `🎉 Your bid on ${startupName} has been accepted!`
      : `Update on your bid for ${startupName}`

    const html = isAccepted
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">🎉 Bid Accepted!</h1>
            <p style="color: #64748b; margin: 0;">Invest Vault</p>
          </div>
          
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #94a3b8; margin: 0 0 12px 0;">Dear <strong style="color: #e2e8f0;">${investorName}</strong>,</p>
            <p style="color: #e2e8f0; margin: 0; font-size: 16px; line-height: 1.6;">
              Great news! The founders of <strong style="color: #3b82f6;">${startupName}</strong> have reviewed your investment bid and decided to <strong style="color: #10b981;">accept</strong> it.
            </p>
          </div>

          <div style="border: 1px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; background: #022c22;">
            <p style="color: #6ee7b7; margin: 0; font-size: 16px; font-weight: bold;">✅ Your bid has been accepted</p>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">Next Steps</h3>
            <ul style="color: #94a3b8; margin: 0; padding: 0 0 0 20px; line-height: 2.2;">
              <li>Log in to Invest Vault to view the full details</li>
              <li>Review and sign the investment agreement</li>
              <li>Complete the payment to finalize your investment</li>
              <li>Connect with the startup team via Messages</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${appUrl}/bids" 
               style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Your Bids →
            </a>
          </div>

          <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 32px;">
            This email was sent by Invest Vault. If you have questions, please log in and use the Messages feature.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">📋 Bid Update</h1>
            <p style="color: #64748b; margin: 0;">Invest Vault</p>
          </div>
          
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #94a3b8; margin: 0 0 12px 0;">Dear <strong style="color: #e2e8f0;">${investorName}</strong>,</p>
            <p style="color: #e2e8f0; margin: 0; font-size: 16px; line-height: 1.6;">
              After careful consideration, the founders of <strong style="color: #3b82f6;">${startupName}</strong> have decided not to move forward with your current bid at this time.
            </p>
          </div>

          ${rejectionReason ? `
          <div style="background: #1c0a0a; border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #f87171; margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Message from the Founder</h3>
            <p style="color: #cbd5e1; margin: 0; font-size: 15px; line-height: 1.7; font-style: italic;">"${rejectionReason}"</p>
          </div>
          ` : ''}

          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">Don't Give Up!</h3>
            <ul style="color: #94a3b8; margin: 0; padding: 0 0 0 20px; line-height: 2.2;">
              <li>Explore other exciting startups on Invest Vault</li>
              <li>Adjust your bid terms and reach out again</li>
              <li>Use the AI Assistant to refine your investment strategy</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${appUrl}/discover" 
               style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Discover Startups →
            </a>
          </div>

          <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 32px;">
            This email was sent by Invest Vault. If you have questions, please log in and use the Messages feature.
          </p>
        </div>
      `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Invest Vault <${fromEmail}>`,
        to: ['omakiwate2408@gmail.com'],
        subject,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})