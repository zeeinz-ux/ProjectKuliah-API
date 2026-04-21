import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const user = (request as any).user

    if (!user) {
      return response.unauthorized({ message: 'Akses tidak sah' })
    }

    if (user.role !== 'super_admin') {
      return response.forbidden({ message: 'Hanya Super Admin yang bisa melakukan aksi ini' })
    }

    return await next()
  }
}