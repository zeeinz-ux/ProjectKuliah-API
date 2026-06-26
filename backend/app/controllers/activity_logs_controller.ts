import type { HttpContext } from '@adonisjs/core/http'
import ActivityLog from '#models/activity_log'

function toActivityResponse(activity: ActivityLog) {
  return {
    id: activity.id,
    userId: activity.userId,
    userName: activity.user?.fullName ?? null,
    userRole: activity.user?.role ?? null,
    module: activity.module,
    action: activity.action,
    title: activity.title,
    description: activity.description,
    icon: activity.icon,
    color: activity.color,
    isRead: activity.isRead,
    dismissedBy: activity.dismissedBy || [],
    metadata: activity.metadata || {},
    createdAt: activity.createdAt?.toISO(),
    updatedAt: activity.updatedAt?.toISO(),
  }
}

function getCurrentUserId(ctx: HttpContext) {
  const user = (ctx as any).auth?.user
  return user?.id ? Number(user.id) : null
}

function getCurrentUser(ctx: HttpContext) {
  return (ctx as any).auth?.user || null
}

const MAX_ACTIVITY_LOGS = 10

export async function pruneActivityLogs() {
  try {
    const total = await ActivityLog.query().count('* as total').first()
    const count = Number(total?.$extras?.total || 0)

    if (count <= MAX_ACTIVITY_LOGS) return

    const overflow = count - MAX_ACTIVITY_LOGS

    const oldest = await ActivityLog.query()
      .orderBy('created_at', 'asc')
      .limit(overflow)
      .select('id')

    const ids = oldest.map((row) => row.id)

    if (ids.length > 0) {
      await ActivityLog.query().whereIn('id', ids).delete()
    }
  } catch {
    // Prune gagal tidak boleh crash request utama
  }
}

export default class ActivityLogsController {
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const module = request.input('module')
    const status = request.input('status')
    const userId = getCurrentUserId(ctx)

    const query = ActivityLog.query()
      .orderBy('created_at', 'desc')
      .limit(MAX_ACTIVITY_LOGS)

    if (userId) {
      query.whereRaw('(dismissed_by IS NULL OR NOT (dismissed_by @> ?))', [JSON.stringify([userId])])
    }

    if (module && module !== 'all') {
      query.where('module', module)
    }

    if (status === 'unread') {
      query.where('is_read', false)
    }

    if (status === 'read') {
      query.where('is_read', true)
    }

    const activities = await query.preload('user')

    return response.ok({
      message: 'Data aktivitas berhasil diambil.',
      data: activities.map((activity) => toActivityResponse(activity)),
    })
  }

  async unreadCount(ctx: HttpContext) {
    const { response } = ctx
    const userId = getCurrentUserId(ctx)

    const query = ActivityLog.query().where('is_read', false)

    if (userId) {
      query.whereRaw('(dismissed_by IS NULL OR NOT (dismissed_by @> ?))', [JSON.stringify([userId])])
    }

    const totalUnread = await query.count('* as total')

    return response.ok({
      message: 'Jumlah notifikasi belum dibaca berhasil diambil.',
      total: Number(totalUnread[0].$extras.total || 0),
    })
  }

  async markAsRead({ params, response }: HttpContext) {
    const activity = await ActivityLog.findOrFail(params.id)

    activity.isRead = true
    await activity.save()

    return response.ok({
      message: 'Notifikasi berhasil ditandai sudah dibaca.',
      data: toActivityResponse(activity),
    })
  }

  async markAllAsRead(ctx: HttpContext) {
    const { response } = ctx
    const userId = getCurrentUserId(ctx)

    const query = ActivityLog.query().where('is_read', false)

    if (userId) {
      query.whereRaw('(dismissed_by IS NULL OR NOT (dismissed_by @> ?))', [JSON.stringify([userId])])
    }

    await query.update({ isRead: true })

    return response.ok({
      message: 'Semua notifikasi berhasil ditandai sudah dibaca.',
    })
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const activity = await ActivityLog.findOrFail(params.id)
    const user = getCurrentUser(ctx)
    const userId = getCurrentUserId(ctx)

    if ((user?.role === 'finance' || user?.role === 'project_manager') && userId) {
      const dismissedBy: number[] = (activity.dismissedBy as number[]) || []
      if (!dismissedBy.includes(userId)) {
        dismissedBy.push(userId)
        activity.dismissedBy = dismissedBy
        await activity.save()
      }
      return response.ok({
        message: 'Notifikasi berhasil dihapus dari daftar Anda.',
      })
    }

    await activity.delete()

    return response.ok({
      message: 'Notifikasi berhasil dihapus.',
    })
  }
}
