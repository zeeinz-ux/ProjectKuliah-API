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

const MAX_ACTIVITY_LOGS = 10

// Hapus log lama sehingga total tidak melebihi MAX_ACTIVITY_LOGS.
// Dipanggil setiap kali log baru dibuat via createActivityLog service.
export async function pruneActivityLogs() {
  try {
    const total = await ActivityLog.query().count('* as total').first()
    const count = Number(total?.$extras?.total || 0)

    if (count <= MAX_ACTIVITY_LOGS) return

    // Ambil id log terlama yang harus dihapus
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
  async index({ request, response }: HttpContext) {
    const module = request.input('module')
    const status = request.input('status')

    const query = ActivityLog.query().orderBy('created_at', 'desc').limit(MAX_ACTIVITY_LOGS)

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
