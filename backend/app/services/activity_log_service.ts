import ActivityLog from '#models/activity_log'
import { pruneActivityLogs } from '#controllers/activity_logs_controller'

type CreateActivityLogPayload = {
  userId?: number | null
  module: string
  action: string
  title: string
  description?: string | null
  icon?: string
  color?: string
  metadata?: Record<string, any> | null
}

export async function createActivityLog(payload: CreateActivityLogPayload) {
  try {
    const log = await ActivityLog.create({
      userId: payload.userId || null,
      module: payload.module,
      action: payload.action,
      title: payload.title,
      description: payload.description || null,
      icon: payload.icon || 'doc',
      color: payload.color || 'green',
      isRead: false,
      metadata: payload.metadata || null,
    })

    // Pastikan total log tidak melebihi 10 — hapus yang terlama
    await pruneActivityLogs()

    return log
  } catch (error) {
    console.error('Create activity log error:', error)
    return null
  }
}
