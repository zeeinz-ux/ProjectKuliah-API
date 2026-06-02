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
    metadata: activity.metadata || {},
    createdAt: activity.createdAt?.toISO(),
    updatedAt: activity.updatedAt?.toISO(),
  }
}

export default class ActivityLogsController {
  async index({ request, response }: HttpContext) {
    const limitInput = Number(request.input('limit', 20))
    const limit = Math.min(Math.max(limitInput || 20, 1), 100)

    const module = request.input('module')
    const status = request.input('status')

    const query = ActivityLog.query().orderBy('created_at', 'desc').limit(limit)

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

  async unreadCount({ response }: HttpContext) {
    const totalUnread = await ActivityLog.query().where('is_read', false).count('* as total')

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

  async markAllAsRead({ response }: HttpContext) {
    await ActivityLog.query().where('is_read', false).update({
      isRead: true,
    })

    return response.ok({
      message: 'Semua notifikasi berhasil ditandai sudah dibaca.',
    })
  }

  async destroy({ params, response }: HttpContext) {
    const activity = await ActivityLog.findOrFail(params.id)

    await activity.delete()

    return response.ok({
      message: 'Notifikasi berhasil dihapus.',
    })
  }
}
