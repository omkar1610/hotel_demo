import { CONFIG } from './config'
import type { Booking } from '@/types'

// ── Email placeholder ─────────────────────────────────────────────────────────
// Production: replace with a real nodemailer + Zoho SMTP implementation.
// The interface is intentionally simple so swapping the transport is trivial.

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

/**
 * Send an email via Zoho SMTP.
 * Currently logs to console — replace with nodemailer transport for production.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  // TODO: Replace with nodemailer implementation
  // const transporter = nodemailer.createTransport({
  //   host: CONFIG.SMTP_HOST,
  //   port: CONFIG.SMTP_PORT,
  //   auth: { user: CONFIG.SMTP_USER, pass: CONFIG.SMTP_PASS },
  // })
  // await transporter.sendMail({ from: CONFIG.EMAIL_FROM, ...payload })

  console.log(`[Email] To: ${payload.to} | Subject: ${payload.subject}`)
}

// ── Email templates ───────────────────────────────────────────────────────────

export async function sendBookingConfirmation(
  booking: Booking & { user: { name: string; email: string }; room: { room_type: { name: string } } }
): Promise<void> {
  await sendEmail({
    to: booking.user.email,
    subject: `Booking Confirmed — ${booking.booking_code}`,
    html: `
      <h2>Your booking is confirmed!</h2>
      <p>Hi ${booking.user.name},</p>
      <p>Your booking at <strong>${CONFIG.SITE_NAME}</strong> is confirmed.</p>
      <table>
        <tr><td><strong>Booking Code</strong></td><td>${booking.booking_code}</td></tr>
        <tr><td><strong>Room</strong></td><td>${booking.room.room_type.name}</td></tr>
        <tr><td><strong>Check-in</strong></td><td>${booking.check_in}</td></tr>
        <tr><td><strong>Check-out</strong></td><td>${booking.check_out}</td></tr>
        <tr><td><strong>Nights</strong></td><td>${booking.nights}</td></tr>
        <tr><td><strong>Total Paid</strong></td><td>₹${booking.total_price.toFixed(2)}</td></tr>
      </table>
      <p>We look forward to welcoming you.</p>
    `,
  })
}

export async function sendBookingCancellation(
  booking: Booking & { user: { name: string; email: string } }
): Promise<void> {
  await sendEmail({
    to: booking.user.email,
    subject: `Booking Cancelled — ${booking.booking_code}`,
    html: `
      <h2>Booking Cancelled</h2>
      <p>Hi ${booking.user.name},</p>
      <p>Your booking <strong>${booking.booking_code}</strong> has been cancelled.</p>
      <p>Note: The Razorpay processing fee (2%) is non-refundable.</p>
      <p>If you have questions, please contact us at ${CONFIG.EMAIL_FROM}.</p>
    `,
  })
}
