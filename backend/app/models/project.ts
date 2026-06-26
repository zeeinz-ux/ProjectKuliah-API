import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import ProjectTask from '#models/project_task'
import ProjectProgressLog from '#models/project_progress_log'
import ProjectMaterial from '#models/project_material'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // Relasi ke tabel clients
  @column({ columnName: 'client_id' })
  declare clientId: number

  // Nama proyek interior
  @column()
  declare name: string

  // Status proyek: progress / done
  @column()
  declare status: string

  // Progress proyek 0 - 100
  @column()
  declare progress: number

  // URL gambar cover proyek
  @column()
  declare cover: string | null

  // Lokasi proyek
  @column()
  declare location: string | null

  // Deadline proyek
  @column.date()
  declare deadline: DateTime | null

  // Tanggal mulai proyek
  @column.date()
  declare startDate: DateTime | null

  // Tim lapangan
  @column()
  declare team: string | null

  // Nilai kontrak / budget proyek
  @column()
  declare budget: number

  // Deskripsi proyek
  @column()
  declare overview: string | null

  // 1 project dimiliki oleh 1 client
  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // TASK-PROGRESS

  @hasMany(() => ProjectTask)
  declare tasks: HasMany<typeof ProjectTask>

  // PROGRESS-UPDATE

  @hasMany(() => ProjectProgressLog)
  declare progressLogs: HasMany<typeof ProjectProgressLog>

  // MATERIAL PROJECT
  @hasMany(() => ProjectMaterial)
  declare projectMaterials: HasMany<typeof ProjectMaterial>
}
