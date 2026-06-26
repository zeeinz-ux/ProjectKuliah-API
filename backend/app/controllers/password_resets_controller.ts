// password_resets_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { DateTime } from 'luxon'

import User from '#models/user'
import PasswordReset from '#models/password_reset'
import { forgotPasswordValidator } from '../validators/forgot_password_validator.js'
import { resetPasswordValidator } from '../validators/reset_password_validator.js'
import { generateResetToken } from '../utils/generate_reset_token.js'
import { createActivityLog } from '#services/activity_log_service'

export default class PasswordResetsController {
  public async forgotPassword({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(forgotPasswordValidator)

      const email = payload.email.trim().toLowerCase()
      const user = await User.findBy('email', email)

      if (!user) {
        return response.badRequest({
          message: 'Email tidak terdaftar.',
        })
      }

      await PasswordReset.query().where('email', user.email).delete()

      const token = generateResetToken(64)
      const expiresAt = DateTime.now().plus({ minutes: 30 })

      await PasswordReset.create({
        email: user.email,
        token,
        expiresAt,
      })

      const frontendUrl = env.get('FRONTEND_URL').replace(/\/$/, '')
      const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`

      await createActivityLog({
        userId: user.id,
        module: 'password_reset',
        action: 'token_requested',
        title: 'Token reset password dibuat',
        description: `${user.fullName} (${user.email}) meminta reset password.`,
        icon: 'user',
        color: 'yellow',
        metadata: {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          expiresAt: expiresAt.toISO(),
        },
      })

      return response.ok({
        message: 'Link reset password berhasil dibuat.',
        resetUrl,
        token,
        expiresAt: expiresAt.setZone('Asia/Jakarta').toFormat('dd LLL yyyy, HH:mm') + ' WIB',
      })
    } catch (error) {
      console.error('Forgot password error:', error)

      return response.internalServerError({
        message: 'Gagal membuat link reset password. Silakan coba lagi.',
      })
    }
  }

  public async resetPassword({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(resetPasswordValidator)

      const passwordReset = await PasswordReset.findBy('token', payload.token)

      if (!passwordReset) {
        return response.badRequest({
          message: 'Token reset password tidak valid.',
        })
      }

      if (passwordReset.expiresAt.toMillis() < DateTime.now().toMillis()) {
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

      await createActivityLog({
        userId: user.id,
        module: 'password_reset',
        action: 'reset_completed',
        title: 'Password berhasil direset',
        description: `${user.fullName} (${user.email}) berhasil mereset password.`,
        icon: 'user',
        color: 'green',
        metadata: {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
        },
      })

      return response.ok({
        message: 'Password berhasil direset. Silakan login dengan password baru.',
      })
    } catch (error) {
      console.error('Reset password error:', error)

      return response.internalServerError({
        message: 'Gagal reset password. Silakan coba lagi.',
      })
    }
  }
}
