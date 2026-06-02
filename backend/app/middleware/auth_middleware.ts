import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  id: number
  email: string
  full_name?: string
  role: 'admin' | 'project_manager' | 'finance'
  iat?: number
  exp?: number
}

export default class AuthMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const header = request.header('authorization')

    if (!header) {
      return response.unauthorized({
        message: 'Akses tidak sah. Token tidak ditemukan.',
      })
    }

    const [type, token] = header.split(' ')

    if (type !== 'Bearer' || !token) {
      return response.unauthorized({
        message: 'Format Authorization header tidak valid.',
      })
    }

    try {
      const decoded = jwt.verify(token, env.get('JWT_SECRET')) as JwtPayload

      console.log('JWT DECODED:', decoded)
      ;(request as any).user = decoded

      return await next()
    } catch (error) {
      return response.unauthorized({
        message: 'Akses tidak sah. Token tidak valid atau sudah kedaluwarsa.',
      })
    }
  }
}
