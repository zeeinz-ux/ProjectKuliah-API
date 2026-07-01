import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import CalendarEvent from '#models/calendar_event'
import Project from '#models/project'
import { createActivityLog } from '#services/activity_log_service'

const ALLOWED_COLORS = ['emerald', 'blue', 'amber', 'red']

function getCurrentUserId(ctx: HttpContext) {
  const user = (ctx as any).auth?.user
  return user?.id ? Number(user.id) : null
}

function normalizeTime(value: unknown, fallback: string) {
  const time = String(value || fallback).slice(0, 5)

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return fallback
  }

  return time
}

function normalizeColor(value: unknown) {
  const color = String(value || 'emerald')

  if (!ALLOWED_COLORS.includes(color)) {
    return 'emerald'
  }

  return color
}

function formatEventDate(event: CalendarEvent) {
  return event.eventDate?.toISODate() || ''
}

function toCalendarResponse(event: CalendarEvent) {
  const today = DateTime.local().startOf('day')
  const eventDate = event.eventDate?.startOf('day')

  // Default untuk Event biasa (Non-Project)
  let computedColor = event.colorKey || 'emerald'
  let computedStatusLabel = 'Event'
  let isOverdue = false

  // JIKA INI ADALAH EVENT PROYEK:
  if (event.projectId && event.project) {
    const pStatus = String(event.project.status || '').toLowerCase()
    const pProgress = Number(event.project.progress || 0)

    if (pStatus === 'selesai' || pStatus === 'done' || pProgress === 100) {
      computedColor = 'emerald'
      computedStatusLabel = 'Proyek Selesai'
      isOverdue = false
      // Sanitize title: rename stale "Deadline:" / "deadline:" to "Selesai:"
      // so frontend normalizeCalendarEvent doesn't flag it as overdue
      event.title = event.title.replace(/^Deadline:\s*/i, 'Selesai: ')
    } else if (eventDate && eventDate < today) {
      const diffDays = Math.floor(today.diff(eventDate, 'days').days)
      computedColor = 'red'
      computedStatusLabel = `Telat ${diffDays} Hari`
      isOverdue = true
    } else {
      computedColor = 'blue'
      computedStatusLabel = 'Proyek Berjalan'
      isOverdue = false
    }
  }

  return {
    id: String(event.id),
    title: event.title,
    start: formatEventDate(event),
    allDay: true,
    extendedProps: {
      colorKey: computedColor,
      statusLabel: computedStatusLabel,
      isOverdue: isOverdue,
      description: event.description || '',
      startTime: normalizeTime(event.startTime, '09:00'),
      endTime: normalizeTime(event.endTime, '10:00'),
      projectId: event.projectId ?? null,
    },
  }
}

export default class CalendarEventsController {
  async index({ request, response }: HttpContext) {
    const year = request.input('year')

    const query = CalendarEvent.query()
      .orderBy('calendar_events.event_date', 'asc')
      .orderBy('calendar_events.start_time', 'asc')
      .select('calendar_events.*')

    if (year && /^\d{4}$/.test(String(year))) {
      query.whereBetween('calendar_events.event_date', [`${year}-01-01`, `${year}-12-31`])
    }

    const events = await query

    const projectIds = [...new Set(events.filter((e) => e.projectId).map((e) => e.projectId!))]
    const projects =
      projectIds.length > 0
        ? await Project.query().whereIn('id', projectIds).select('id', 'status', 'progress')
        : []
    const projectMap = new Map(projects.map((p) => [p.id, p]))

    const processed = events.map((event) => {
      if (event.projectId) {
        ;(event as any).project = projectMap.get(event.projectId) ?? null
      }
      return toCalendarResponse(event)
    })

    return response.ok({
      message: 'Data event calendar berhasil diambil.',
      events: processed,
    })
  }

  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const body = request.only([
      'title',
      'date',
      'start',
      'eventDate',
      'startTime',
      'endTime',
      'colorKey',
      'description',
    ])

    const title = String(body.title || '').trim()
    const dateInput = body.date || body.start || body.eventDate

    if (!title) {
      return response.status(422).json({
        message: 'Title wajib diisi.',
      })
    }

    if (!dateInput) {
      return response.status(422).json({
        message: 'Date wajib diisi.',
      })
    }

    const eventDate = DateTime.fromISO(String(dateInput))

    if (!eventDate.isValid) {
      return response.status(422).json({
        message: 'Format date tidak valid.',
      })
    }

    const startTime = normalizeTime(body.startTime, '09:00')
    const endTime = normalizeTime(body.endTime, '10:00')

    if (endTime < startTime) {
      return response.status(422).json({
        message: 'End Time tidak boleh lebih kecil dari Start Time.',
      })
    }

    const event = await CalendarEvent.create({
      title,
      eventDate,
      startTime,
      endTime,
      colorKey: normalizeColor(body.colorKey),
      description: body.description ? String(body.description).trim() : null,
    })

    await createActivityLog({
      userId,
      module: 'calendar',
      action: 'created',
      title: 'Jadwal event dibuat',
      description: `Event "${event.title}" berhasil dibuat pada ${formatEventDate(event)} pukul ${event.startTime} - ${event.endTime}.`,
      icon: 'doc',
      color: 'green',
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: formatEventDate(event),
        startTime: event.startTime,
        endTime: event.endTime,
        colorKey: event.colorKey,
        description: event.description,
      },
    })

    return response.status(201).json({
      message: 'Event berhasil ditambahkan.',
      event: toCalendarResponse(event),
    })
  }

  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const event = await CalendarEvent.findOrFail(params.id)

    const oldEvent = {
      id: event.id,
      title: event.title,
      eventDate: formatEventDate(event),
      startTime: event.startTime,
      endTime: event.endTime,
      colorKey: event.colorKey,
      description: event.description,
    }

    const body = request.only([
      'title',
      'date',
      'start',
      'eventDate',
      'startTime',
      'endTime',
      'colorKey',
      'description',
    ])

    const nextTitle = body.title !== undefined ? String(body.title || '').trim() : event.title

    const dateInput = body.date || body.start || body.eventDate
    const nextDate = dateInput ? DateTime.fromISO(String(dateInput)) : event.eventDate

    const nextStartTime =
      body.startTime !== undefined
        ? normalizeTime(body.startTime, '09:00')
        : normalizeTime(event.startTime, '09:00')

    const nextEndTime =
      body.endTime !== undefined
        ? normalizeTime(body.endTime, '10:00')
        : normalizeTime(event.endTime, '10:00')

    if (!nextTitle) {
      return response.status(422).json({
        message: 'Title wajib diisi.',
      })
    }

    if (!nextDate.isValid) {
      return response.status(422).json({
        message: 'Format date tidak valid.',
      })
    }

    if (nextEndTime < nextStartTime) {
      return response.status(422).json({
        message: 'End Time tidak boleh lebih kecil dari Start Time.',
      })
    }

    event.merge({
      title: nextTitle,
      eventDate: nextDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      colorKey: body.colorKey !== undefined ? normalizeColor(body.colorKey) : event.colorKey,
      description:
        body.description !== undefined
          ? String(body.description || '').trim() || null
          : event.description,
    })

    await event.save()

    await createActivityLog({
      userId,
      module: 'calendar',
      action: 'updated',
      title: 'Jadwal event diperbarui',
      description: `Event "${event.title}" berhasil diperbarui.`,
      icon: 'doc',
      color: 'blue',
      metadata: {
        eventId: event.id,
        oldTitle: oldEvent.title,
        newTitle: event.title,
        oldDate: oldEvent.eventDate,
        newDate: formatEventDate(event),
        oldStartTime: oldEvent.startTime,
        newStartTime: event.startTime,
        oldEndTime: oldEvent.endTime,
        newEndTime: event.endTime,
        oldColorKey: oldEvent.colorKey,
        newColorKey: event.colorKey,
        oldDescription: oldEvent.description,
        newDescription: event.description,
      },
    })

    return response.ok({
      message: 'Event berhasil diperbarui.',
      event: toCalendarResponse(event),
    })
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const userId = getCurrentUserId(ctx)

    const event = await CalendarEvent.findOrFail(params.id)

    const deletedEvent = {
      id: event.id,
      title: event.title,
      eventDate: formatEventDate(event),
      startTime: event.startTime,
      endTime: event.endTime,
      colorKey: event.colorKey,
      description: event.description,
    }

    await event.delete()

    await createActivityLog({
      userId,
      module: 'calendar',
      action: 'deleted',
      title: 'Jadwal event dihapus',
      description: `Event "${deletedEvent.title}" pada ${deletedEvent.eventDate} berhasil dihapus.`,
      icon: 'doc',
      color: 'red',
      metadata: {
        eventId: deletedEvent.id,
        eventTitle: deletedEvent.title,
        eventDate: deletedEvent.eventDate,
        startTime: deletedEvent.startTime,
        endTime: deletedEvent.endTime,
        colorKey: deletedEvent.colorKey,
        description: deletedEvent.description,
      },
    })

    return response.ok({
      message: 'Event berhasil dihapus.',
    })
  }
}
