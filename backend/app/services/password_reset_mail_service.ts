import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

type SendResetLinkPayload = {
  to: string
  resetUrl: string
  expiresAt: string
}

export default class PasswordResetMailService {
  public static async sendResetLink({ to, resetUrl, expiresAt }: SendResetLinkPayload) {
    await mail.send((message) => {
      message
        .to(to)
        .from(env.get('MAIL_FROM_ADDRESS'), env.get('MAIL_FROM_NAME'))
        .subject('Reset Password - Medtic Interior').html(`
          <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
            <h2 style="margin-bottom: 8px;">Reset Password</h2>
            <p>Kami menerima permintaan untuk mereset password akun kamu di <strong>Medtic Interior</strong>.</p>
            <p>Klik tombol di bawah ini untuk membuat password baru:</p>

            <p style="margin: 24px 0;">
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  background: #059669;
                  color: #ffffff;
                  text-decoration: none;
                  padding: 12px 20px;
                  border-radius: 10px;
                  font-weight: 700;
                "
              >
                Reset Password
              </a>
            </p>

            <p>Link ini berlaku sampai <strong>${expiresAt}</strong>.</p>
            <p>Kalau kamu tidak merasa meminta reset password, abaikan email ini.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <p style="font-size: 12px; color: #6b7280;">
              Jika tombol tidak bisa diklik, salin link ini ke browser:<br />
              <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
            </p>
          </div>
        `).text(`
Reset Password - Medtic Interior

Kami menerima permintaan untuk mereset password akun kamu.

Buka link berikut untuk membuat password baru:
${resetUrl}

Link ini berlaku sampai ${expiresAt}.

Kalau kamu tidak meminta reset password, abaikan email ini.
        `)
    })
  }
}