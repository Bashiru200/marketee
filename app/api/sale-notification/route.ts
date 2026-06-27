// app/api/sale-notification/route.ts
// Sends a sale notification email to all customers who have saved this business.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const resend   = new Resend(process.env.RESEND_API_KEY!)

  try {
    const {
      businessId,
      ownerId,
      productId,
      saleLabel,
      message,
      productName,
      originalPrice,
      salePrice,
    } = await req.json()

    // Verify the requester owns this business
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, owner_id, phone')
      .eq('id', businessId)
      .single()

    if (!biz || biz.owner_id !== ownerId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // Get all customers who have saved this business
    const { data: saved } = await supabase
      .from('saved_businesses')
      .select('user_id, profiles(email, name)')
      .eq('business_id', businessId)

    if (!saved || saved.length === 0) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        message: 'No customers have saved this business yet.',
      })
    }

    const recipients = saved
      .map((s: any) => ({
        email: s.profiles?.email,
        name:  s.profiles?.name ?? 'Valued customer',
      }))
      .filter(r => !!r.email)

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const discount = originalPrice && salePrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : null

    // Send email to each recipient individually (personalised)
    const sends = recipients.map(r =>
      resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      r.email,
        subject: `🎉 ${saleLabel ?? 'Sale'} at ${biz.name}`,
        html: `
          <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;">

            <tr><td style="background:#085041;padding:32px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td><img src="https://markeetee.com/logo1.png" width="42" height="42" alt="Markeetee" style="display:block;border-radius:10px;"/></td>
                <td style="padding-left:12px;color:#ffffff;font-size:24px;font-weight:700;">Markeetee</td>
              </tr></table>
              <p style="margin:28px 0 6px;font-size:22px;font-weight:700;color:#ffffff;">
                🎉 ${saleLabel ?? 'Special offer'} at ${biz.name}
              </p>
              <p style="margin:0;font-size:13px;color:#9FE1CB;">A business you saved has a sale on</p>
            </td></tr>

            <tr><td style="padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${r.name}</strong>,</p>
              <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
                <strong>${biz.name}</strong>, a business you saved on Markeetee, is running a special offer:
              </p>

              ${productName ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:#f0faf6;border-radius:12px;padding:20px;">
                  <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#085041;">${productName}</p>
                  ${originalPrice && salePrice ? `
                  <p style="margin:0 0 4px;font-size:13px;color:#6B7280;text-decoration:line-through;">Was $${Number(originalPrice).toFixed(2)}</p>
                  <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1D9E75;">$${Number(salePrice).toFixed(2)}
                    ${discount ? `<span style="font-size:14px;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;margin-left:8px;">${discount}% OFF</span>` : ''}
                  </p>
                  ` : ''}
                  ${message ? `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${message}</p>` : ''}
                </td></tr>
              </table>
              ` : message ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:#f0faf6;border-radius:12px;padding:20px;">
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
                </td></tr>
              </table>
              ` : ''}

              ${biz.phone ? `
              <div style="text-align:center;margin:24px 0;">
                <a href="https://wa.me/${biz.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi! I saw your ${saleLabel ?? 'sale'} on Markeetee for ${productName ?? biz.name}. I'm interested!`)}"
                  style="display:inline-block;background:#25D366;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;margin-right:8px;">
                  💬 WhatsApp them
                </a>
              </div>
              ` : ''}

              <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0;">
                You received this because you saved <strong>${biz.name}</strong> on Markeetee.
              </p>
            </td></tr>

            <tr><td style="background:#f9fafb;padding:28px 32px;text-align:center;border:1px solid #eeeeee;border-top:none;border-radius:0 0 16px 16px;">
              <img src="https://markeetee.com/Cartography_of_Africa.png" width="55" height="55" alt="Africa" style="display:block;margin:0 auto 14px;"/>
              <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">Africa is here. Find it.</p>
              <p style="margin:6px 0 20px;font-size:13px;color:#6B7280;">The African business directory for the US diaspora.</p>
              <p style="font-size:11px;color:#9CA3AF;margin:0;">
                © 2026 Markeetee &nbsp;·&nbsp;
                <a href="https://markeetee.com/privacy" style="color:#9CA3AF;text-decoration:none;">Privacy</a> &nbsp;·&nbsp;
                <a href="https://markeetee.com/contact" style="color:#9CA3AF;text-decoration:none;">Contact</a>
              </p>
            </td></tr>

          </table>
          </div>
        `,
      })
    )

    await Promise.allSettled(sends)

    // Log the notification
    await supabase.from('sale_notifications').insert({
      business_id:     businessId,
      product_id:      productId ?? null,
      message:         message ?? `${saleLabel} on ${productName ?? biz.name}`,
      recipient_count: recipients.length,
    })

    return NextResponse.json({ ok: true, sent: recipients.length })
  } catch (err) {
    console.error('[sale-notification]', err)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}