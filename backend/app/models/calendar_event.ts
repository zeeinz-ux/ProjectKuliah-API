import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'

export default class CalendarEvent extends BaseModel {
  static table = 'calendar_events'

  @column({ isPrimary: true })
  declare id: number

  @column.date()
  declare eventDate: DateTime

  @column()
  declare title: string

  @column()
  declare startTime: string

  @column()
  declare endTime: string

  @column()
  declare colorKey: string

  @column()
  declare description: string | null

  @column({ columnName: 'project_id' })
  declare projectId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>
}
