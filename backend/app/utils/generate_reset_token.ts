// app/utils/generate_reset_token.ts
import crypto from 'node:crypto'

export function generateResetToken(length = 64): string {
  return crypto.randomBytes(length / 2).toString('hex')
}