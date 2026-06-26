import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class ActivityLog extends BaseModel {
  static table = 'activity_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @column()
  declare module: string

  @column()
  declare action: string

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare icon: string

  @column()
  declare color: string

  @column()
  declare isRead: boolean

  @column()
  declare metadata: Record<string, any> | null

  @column()
  declare dismissedBy: number[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
