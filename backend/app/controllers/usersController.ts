import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { createActivityLog } from '#services/activity_log_service'

const ROLES = ['admin', 'project_manager', 'finance'] as const
const DEPARTEMEN_LIST = ['Super User', 'Operator Data', 'Keuangan'] as const

type UserRole = (typeof ROLES)[number]
type UserDepartemen = (typeof DEPARTEMEN_LIST)[number]

function getCurrentUserId(ctx: HttpContext) {
  const authUserFromRequest = (ctx.request as any).user
  const authUserFromAuth = (ctx as any).auth?.user

  const user = authUserFromRequest || authUserFromAuth

  return user?.id ? Number(user.id) : null
}

export default class UsersController {
  private serializeUser(user: User) {
    return {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      departemen: user.departemen,
      is_active: user.isActive,
      bio: user.bio,
      avatar: user.avatar,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }
  }

  // =========================
  // PROFILE USER YANG SEDANG LOGIN
  // =========================
  public async me({ request, response }: HttpContext) {
    const authUser = (request as any).user

    if (!authUser) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const user = await User.find(authUser.id)

    if (!user) {
      return response.notFound({ message: 'User tidak ditemukan' })
    }

    return response.ok(this.serializeUser(user))
  }

  public async updateMe(ctx: HttpContext) {
    const { request, response } = ctx
    const authUser = (request as any).user
    const userId = getCurrentUserId(ctx)

    if (!authUser) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const user = await User.find(authUser.id)

    if (!user) {
      return response.notFound({ message: 'User tidak ditemukan' })
    }

    const oldUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
    }

    const payload = request.only(['full_name', 'email', 'bio', 'avatar'])

    const fullName = payload.full_name?.trim()
    const email = payload.email?.trim().toLowerCase()

    if (!fullName || !email) {
      return response.badRequest({
        message: 'Nama lengkap dan email wajib diisi',
      })
    }

    const existingUser = await User.findBy('email', email)
    if (existingUser && existingUser.id !== user.id) {
      return response.conflict({
        message: 'Email sudah digunakan user lain',
      })
    }

    user.fullName = fullName
    user.email = email
    user.bio = payload.bio?.trim() || null
    user.avatar = payload.avatar?.trim() || null

    await user.save()

    await createActivityLog({
      userId,
      module: 'user',
      action: 'profile_updated',
      title: 'Profil pengguna diperbarui',
      description: `Profil ${user.fullName} berhasil diperbarui.`,
      icon: 'user',
      color: 'blue',
      metadata: {
        userId: user.id,
        oldFullName: oldUser.fullName,
        newFullName: user.fullName,
        oldEmail: oldUser.email,
        newEmail: user.email,
        oldBio: oldUser.bio,
        newBio: user.bio,
        oldAvatar: oldUser.avatar,
        newAvatar: user.avatar,
      },
    })

    return response.ok({
      message: 'Profil berhasil diperbarui',
      user: this.serializeUser(user),
    })
  }

  public async changePassword(ctx: HttpContext) {
    const { request, response } = ctx
    const authUser = (request as any).user
    const userId = getCurrentUserId(ctx)

    if (!authUser) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const user = await User.find(authUser.id)

    if (!user) {
      return response.notFound({ message: 'User tidak ditemukan' })
    }

    const { currentPassword, newPassword } = request.only(['currentPassword', 'newPassword'])

    if (!currentPassword || !newPassword) {
      return response.badRequest({
        message: 'Current password dan new password wajib diisi',
      })
    }

    if (newPassword.length < 6) {
      return response.badRequest({
        message: 'New password minimal 6 karakter',
      })
    }

    const isValidPassword = await hash.verify(user.password, currentPassword)

    if (!isValidPassword) {
      return response.badRequest({
        message: 'Current password salah',
      })
    }

    user.password = newPassword
    await user.save()

    await createActivityLog({
      userId,
      module: 'user',
      action: 'password_changed',
      title: 'Password pengguna diperbarui',
      description: `Password akun ${user.fullName} berhasil diperbarui.`,
      icon: 'user',
      color: 'yellow',
      metadata: {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    })

    return response.ok({
      message: 'Password berhasil diperbarui',
    })
  }

  // =========================
  // USER MANAGEMENT
  // =========================
  public async index({ response }: HttpContext) {
    const users = await User.query().orderBy('id', 'desc')

    return response.ok(users.map((user) => this.serializeUser(user)))
  }

  public async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User tidak ditemukan' })
    }

    return response.ok(this.serializeUser(user))
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx
    const currentUserId = getCurrentUserId(ctx)

    const payload = request.only([
      'full_name',
      'email',
      'password',
      'role',
      'departemen',
      'is_active',
      'bio',
      'avatar',
    ])

    const fullName = payload.full_name?.trim()
    const email = payload.email?.trim().toLowerCase()
    const password = payload.password
    const role = payload.role as UserRole
    const departemen = payload.departemen as UserDepartemen
    const isActive = payload.is_active === undefined ? true : Boolean(payload.is_active)

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
      return response.badRequest({ message: 'Role tidak valid' })
    }

    if (!DEPARTEMEN_LIST.includes(departemen)) {
      return response.badRequest({ message: 'Departemen tidak valid' })
    }

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      return response.conflict({ message: 'Email sudah terdaftar' })
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      departemen,
      isActive,
      bio: payload.bio?.trim() || null,
      avatar: payload.avatar?.trim() || null,
    })

    await createActivityLog({
      userId: currentUserId,
      module: 'user',
      action: 'created',
      title: 'User baru ditambahkan',
      description: `User ${user.fullName} dengan role ${user.role} berhasil ditambahkan.`,
      icon: 'user',
      color: 'cyan',
      metadata: {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        departemen: user.departemen,
        isActive: user.isActive,
      },
    })

    return response.created({
      message: 'User berhasil ditambahkan',
      user: this.serializeUser(user),
    })
  }

  public async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const currentUserId = getCurrentUserId(ctx)

    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User tidak ditemukan' })
    }

    const oldUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      departemen: user.departemen,
      isActive: user.isActive,
      bio: user.bio,
      avatar: user.avatar,
    }

    const payload = request.only([
      'full_name',
      'email',
      'password',
      'role',
      'departemen',
      'is_active',
      'bio',
      'avatar',
    ])

    if (payload.email) {
      const normalizedEmail = payload.email.trim().toLowerCase()
      const existingUser = await User.findBy('email', normalizedEmail)

      if (existingUser && existingUser.id !== user.id) {
        return response.conflict({ message: 'Email sudah digunakan user lain' })
      }

      user.email = normalizedEmail
    }

    if (payload.full_name !== undefined) {
      user.fullName = payload.full_name.trim()
    }

    if (payload.password) {
      if (payload.password.length < 6) {
        return response.badRequest({
          message: 'Password minimal 6 karakter',
        })
      }

      user.password = payload.password
    }

    if (payload.role !== undefined) {
      if (!ROLES.includes(payload.role as UserRole)) {
        return response.badRequest({ message: 'Role tidak valid' })
      }

      user.role = payload.role as UserRole
    }

    if (payload.departemen !== undefined) {
      if (!DEPARTEMEN_LIST.includes(payload.departemen as UserDepartemen)) {
        return response.badRequest({ message: 'Departemen tidak valid' })
      }

      user.departemen = payload.departemen as UserDepartemen
    }

    if (payload.is_active !== undefined) {
      user.isActive = Boolean(payload.is_active)
    }

    if (payload.bio !== undefined) {
      user.bio = payload.bio?.trim() || null
    }

    if (payload.avatar !== undefined) {
      user.avatar = payload.avatar?.trim() || null
    }

    await user.save()

    await createActivityLog({
      userId: currentUserId,
      module: 'user',
      action: 'updated',
      title: 'User diperbarui',
      description: `Data user ${user.fullName} berhasil diperbarui.`,
      icon: 'user',
      color: 'blue',
      metadata: {
        userId: user.id,
        oldFullName: oldUser.fullName,
        newFullName: user.fullName,
        oldEmail: oldUser.email,
        newEmail: user.email,
        oldRole: oldUser.role,
        newRole: user.role,
        oldDepartemen: oldUser.departemen,
        newDepartemen: user.departemen,
        oldIsActive: oldUser.isActive,
        newIsActive: user.isActive,
        oldBio: oldUser.bio,
        newBio: user.bio,
        oldAvatar: oldUser.avatar,
        newAvatar: user.avatar,
        passwordChanged: Boolean(payload.password),
      },
    })

    return response.ok({
      message: 'User berhasil diperbarui',
      user: this.serializeUser(user),
    })
  }

  public async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const currentUserId = getCurrentUserId(ctx)

    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User tidak ditemukan' })
    }

    const deletedUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      departemen: user.departemen,
      isActive: user.isActive,
    }

    await user.delete()

    await createActivityLog({
      userId: currentUserId,
      module: 'user',
      action: 'deleted',
      title: 'User dihapus',
      description: `User ${deletedUser.fullName} berhasil dihapus dari sistem.`,
      icon: 'user',
      color: 'red',
      metadata: {
        userId: deletedUser.id,
        fullName: deletedUser.fullName,
        email: deletedUser.email,
        role: deletedUser.role,
        departemen: deletedUser.departemen,
        isActive: deletedUser.isActive,
      },
    })

    return response.ok({
      message: 'User berhasil dihapus',
    })
  }
}
