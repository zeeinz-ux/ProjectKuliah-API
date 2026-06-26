import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type Role = 'admin' | 'project_manager' | 'finance'
type Action = 'read' | 'write' | 'delete'
type Resource = 'users' | 'projects' | 'materials' | 'clients' | 'calendar-events' | 'files' | 'reports' | 'activity-logs'

const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    users: ['read', 'write', 'delete'],
    projects: ['read', 'write', 'delete'],
    materials: ['read', 'write', 'delete'],
    clients: ['read', 'write', 'delete'],
    'calendar-events': ['read', 'write', 'delete'],
    files: ['read', 'write', 'delete'],
    reports: ['read', 'write', 'delete'],
    'activity-logs': ['read', 'write', 'delete'],
  },
  project_manager: {
    projects: ['read', 'write'],
    materials: ['read', 'write', 'delete'],
    clients: ['read', 'write'],
    'calendar-events': ['read', 'write', 'delete'],
    files: ['read', 'write', 'delete'],
    reports: ['read'],
    'activity-logs': ['read', 'write'],
  },
  finance: {
    projects: ['read'],
    materials: ['read'],
    clients: ['read'],
    'calendar-events': ['read'],
    files: ['read', 'write', 'delete'],
    reports: ['read', 'write'],
    'activity-logs': ['read', 'write', 'delete'],
  },
}

export default class CanMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn, args: string[]) {
    const [action, resource] = args as [Action, Resource]

    if (!action || !resource) {
      return response.badRequest({
        message: 'Parameter middleware "can" tidak lengkap. Format: can:action:resource',
      })
    }

    const user = (request as any).user

    if (!user) {
      return response.unauthorized({
        message: 'Akses tidak sah. Silakan login terlebih dahulu.',
      })
    }

    const role: Role = user.role
    const rolePermissions = PERMISSIONS[role]
    const resourcePermissions = rolePermissions?.[resource]

    if (!resourcePermissions) {
      return response.forbidden({
        message: `Akses ditolak. Anda tidak memiliki akses ke modul ${resource}.`,
      })
    }

    if (!resourcePermissions.includes(action)) {
      return response.forbidden({
        message: `Akses ditolak. Role ${role} tidak memiliki izin ${action} pada modul ${resource}.`,
      })
    }

    return await next()
  }
}
