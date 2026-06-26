import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import { createActivityLog } from '#services/activity_log_service'

const ROLES = ['admin', 'project_manager', 'finance'] as const

const DEPARTEMEN_LIST = ['Super User', 'Operator Data', 'Keuangan'] as const

type UserRole = (typeof ROLES)[number]
type UserDepartemen = (typeof DEPARTEMEN_LIST)[number]

export default class AuthController {
  // POST /register
  public async register({ request, response }: HttpContext) {
    try {
      const payload = request.only(['full_name', 'email', 'password', 'role', 'departemen'])

      const fullName = payload.full_name?.trim()
      const email = payload.email?.trim().toLowerCase()
      const password = payload.password
      const role = payload.role as UserRole
      const departemen = payload.departemen as UserDepartemen

      if (!fullName || !email || !password || !role || !departemen) {
        return response.badRequest({
          message: 'Nama lengkap, email, password, role, dan departemen wajib diisi',
        })
      }

      if (password.length < 6) {
        return response.badRequest({
          message: 'Password minimal 6 karakter',
        })
      }

      if (!ROLES.includes(role)) {
        return response.badRequest({
          message: 'Role tidak valid',
        })
      }

      if (!DEPARTEMEN_LIST.includes(departemen)) {
        return response.badRequest({
          message: 'Departemen tidak valid',
        })
      }

      const existingUser = await User.findBy('email', email)

      if (existingUser) {
        return response.conflict({
          message: 'Email sudah terdaftar',
        })
      }

      const user = await User.create({
        fullName,
        email,
        password,
        role,
        departemen,
        isActive: true,
      })

      await createActivityLog({
        userId: user.id,
        module: 'auth',
        action: 'registered',
        title: 'User baru terdaftar',
        description: `${fullName} (${email}) berhasil mendaftar sebagai ${role}.`,
        icon: 'user',
        color: 'green',
        metadata: {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          departemen: user.departemen,
        },
      })

      return response.created({
        message: 'Registrasi berhasil',
        user: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          role: user.role,
          departemen: user.departemen,
          is_active: user.isActive,
        },
      })
    } catch (error) {
      console.error('Register error:', error)

      return response.internalServerError({
        message: 'Terjadi kesalahan server saat registrasi',
      })
    }
  }

  // POST /login
  public async login({ request, response }: HttpContext) {
    try {
      const payload = request.only(['email', 'password', 'role'])

      const email = payload.email?.trim().toLowerCase()
      const password = payload.password
      const role = payload.role as UserRole

      if (!email || !password || !role) {
        return response.badRequest({
          message: 'Email, password, dan role wajib diisi',
        })
      }

      if (!ROLES.includes(role)) {
        return response.badRequest({
          message: 'Role tidak valid',
        })
      }

      const user = await User.findBy('email', email)

      if (!user) {
        return response.unauthorized({
          message: 'Email, password, atau role salah',
        })
      }

      if (!user.isActive) {
        return response.forbidden({
          message: 'Akun tidak aktif, silakan hubungi admin',
        })
      }

      if (user.role !== role) {
        return response.unauthorized({
          message: 'Email, password, atau role salah',
        })
      }

      const isValidPassword = await hash.verify(user.password, password)

      if (!isValidPassword) {
        return response.unauthorized({
          message: 'Email, password, atau role salah',
        })
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
        },
        env.get('JWT_SECRET'),
        { expiresIn: '24h' }
      )

      await createActivityLog({
        userId: user.id,
        module: 'auth',
        action: 'logged_in',
        title: 'Pengguna login',
        description: `${user.fullName} (${user.email}) berhasil login sebagai ${user.role}.`,
        icon: 'user',
        color: 'blue',
        metadata: {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      })

      return response.ok({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          role: user.role,
          departemen: user.departemen,
          is_active: user.isActive,
        },
        redirectTo: '/admin',
      })
    } catch (error) {
      console.error('Login error:', error)

      return response.internalServerError({
        message: 'Terjadi kesalahan server saat login',
      })
    }
  }
}

// Sisipkan activity log login setelah login sukses
// tapi sebelum return response
