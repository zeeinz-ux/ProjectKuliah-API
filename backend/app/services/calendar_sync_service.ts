import CalendarEvent from '#models/calendar_event'
import type Project from '#models/project'

export async function syncProjectCalendarEvents(project: Project) {
  await CalendarEvent.query().where('project_id', project.id).delete()

  const events: any[] = []

  if (project.startDate) {
    events.push({
      title: `Mulai: ${project.name}`,
      eventDate: project.startDate,
      startTime: '08:00',
      endTime: '17:00',
      colorKey: 'blue',
      description: `Proyek ${project.name} dimulai.`,
      projectId: project.id,
    })
  }

  if (project.deadline && project.status !== 'done' && project.progress < 100) {
    events.push({
      title: `Deadline: ${project.name}`,
      eventDate: project.deadline,
      startTime: '08:00',
      endTime: '17:00',
      colorKey: 'red',
      description: `Deadline proyek ${project.name}.`,
      projectId: project.id,
    })
  }

  if ((project.status === 'done' || project.progress === 100) && project.updatedAt) {
    events.push({
      title: `Selesai: ${project.name}`,
      eventDate: project.updatedAt.toISODate(),
      startTime: '08:00',
      endTime: '17:00',
      colorKey: 'emerald',
      description: `Proyek ${project.name} telah selesai.`,
      projectId: project.id,
    })
  }

  for (const eventData of events) {
    await CalendarEvent.create(eventData)
  }
}
