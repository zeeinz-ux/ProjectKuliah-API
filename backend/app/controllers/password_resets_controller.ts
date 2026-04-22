// password_resets_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { DateTime } from 'luxon'

import User from '#models/user'
import PasswordReset from '#models/password_reset'
import { forgotPasswordValidator } from '../validators/forgot_password_validator.js'
import { resetPasswordValidator } from '../validators/reset_password_validator.js'
import { generateResetToken } from '../utils/generate_reset_token.js'
import PasswordResetMailService from '../services/password_reset_mail_service.js'

export default class PasswordResetsController {
  public async forgotPassword({ request, response }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', payload.email)

    if (!user) {
      return response.ok({
        message: 'Jika email terdaftar, link reset password akan dikirim.',
      })
    }

    await PasswordReset.query().where('email', user.email).delete()

    const token = generateResetToken(64)
    const expiresAt = DateTime.now().plus({ minutes: 30 })

    const passwordReset = await PasswordReset.create({
      email: user.email,
      token,
      expiresAt,
    })

    const frontendUrl = env.get('FRONTEND_URL').replace(/\/$/, '')
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`

    try {
      await PasswordResetMailService.sendResetLink({
        to: user.email,
        resetUrl,
        expiresAt: `${expiresAt.setZone('Asia/Jakarta').toFormat('dd LLL yyyy, HH:mm')} WIB`,
      })
    } catch (error) {
      await passwordReset.delete()
      console.error('Failed to send password reset email:', error)

      return response.internalServerError({
        message: 'Gagal mengirim email reset password. Silakan coba lagi.',
      })
    }

    return response.ok({
      message: 'Jika email terdaftar, link reset password akan dikirim.',
    })
  }

  public async resetPassword({ request, response }: HttpContext) {
    const payload = await request.validateUsing(resetPasswordValidator)

    const passwordReset = await PasswordReset.findBy('token', payload.token)

    if (!passwordReset) {
      return response.badRequest({
        message: 'Token reset password tidak valid.',
      })
    }

    if (passwordReset.expiresAt < DateTime.now()) {
      await passwordReset.delete()

      return response.badRequest({
        message: 'Token reset password sudah kedaluwarsa.',
      })
    }

    const user = await User.findBy('email', passwordReset.email)

    if (!user) {
      await passwordReset.delete()

      return response.notFound({
        message: 'User tidak ditemukan.',
      })
    }

    user.password = payload.password
    await user.save()

    await passwordReset.delete()

    return response.ok({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    })
  }
}
