// app/validators/reset_password_validator.ts
import vine from '@vinejs/vine'

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().trim().minLength(64).maxLength(64),
    password: vine.string().minLength(6),
    password_confirmation: vine.string().sameAs('password'),
  })
)
