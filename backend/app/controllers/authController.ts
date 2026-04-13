import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/users'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(env.get('GOOGLE_CLIENT_ID'))

export default class AuthController {
  // POST /register
  public async register({ request, response }: HttpContext) {
    try {
      const { name, email, password } = request.only(['name', 'email', 'password'])

      if (!name || !email || !password) {
        return response.badRequest({
          message: 'Nama, email, dan password wajib diisi',
        })
      }

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return response.badRequest({ message: 'Email sudah terdaftar' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user',
      })

      return response.created({
        message: 'User berhasil dibuat',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      console.error('Register error:', error)
      return response.internalServerError({ message: 'Terjadi kesalahan server' })
    }
  }

  // POST /login
  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      // Find user by email
      const user = await User.findOne({ email })
      if (!user) {
        return response.unauthorized({ message: 'Email atau password salah' })
      }

      // Kalau user tidak punya password (akun Google), tolak login password
      if (!user.password) {
        return response.unauthorized({
          message: 'Akun ini tidak bisa login dengan password, silakan login dengan Google',
        })
      }

      // Check password (di sini TS sudah yakin user.password adalah string)
      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return response.unauthorized({ message: 'Email atau password salah' })
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        env.get('JWT_SECRET') || '',
        { expiresIn: '24h' }
      )

      return response.ok({
        message: 'Login berhasil',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      return response.internalServerError({ message: 'Terjadi kesalahan server' })
    }
  }

  // google login
  public async googleLogin({ request, response }: HttpContext) {
    try {
      const { idToken } = request.only(['idToken'])

      if (!idToken) {
        return response.badRequest({ message: 'ID Token is required' })
      }

      // 1. Verifikasi token ke Google
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.get('GOOGLE_CLIENT_ID'),
      })
      const payload = ticket.getPayload()

      if (!payload) {
        return response.unauthorized({ message: 'Invalid Google Token' })
      }

      const googleId = payload.sub
      const email = payload.email
      const name = payload.name

      if (!email) {
        return response.unauthorized({ message: 'Google account has no email' })
      }

      // 2. Cari atau buat user
      let user = await User.findOne({ googleId })

      if (!user) {
        // belum ada user dengan googleId → cek berdasarkan email
        user = await User.findOne({ email })

        if (user) {
          // link akun Google ke akun yang sudah ada
          user.googleId = googleId
          if (!user.name && name) user.name = name
          await user.save()
        } else {
          // user benar-benar baru → buat akun baru
          user = await User.create({
            name,
            email,
            googleId,
            password: '', // atau biarkan null kalau schema mengizinkan
            // role: 'user', // isi ini kalau tidak ada default di schema
          })
        }
      }

      // 3. Buat JWT (SELALU setelah user pasti ada)
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        env.get('JWT_SECRET') || '',
        { expiresIn: '24h' }
      )

      const redirectTo = user.role === 'admin' ? '/admin' : '/monitoring'

      return response.ok({
        message: 'Login berhasil',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        },
        redirectTo,
      })
    } catch (error) {
      console.error('Google login error:', error)
      return response.internalServerError({ message: 'Terjadi kesalahan server' })
    }
  }
}
