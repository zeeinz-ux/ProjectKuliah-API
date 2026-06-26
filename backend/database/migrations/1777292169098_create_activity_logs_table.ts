import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'activity_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // User yang melakukan aktivitas.
      // Nullable supaya log tetap aman walaupun user terhapus / sistem membuat log otomatis.
      table
        .integer('user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')

      // Modul sumber aktivitas: project, client, material, file, report, calendar, user, dll.
      table.string('module', 30).notNullable()

      // Aksi aktivitas: created, updated, deleted, uploaded, downloaded, completed, dll.
      table.string('action', 30).notNullable()

      // Judul notifikasi yang tampil di Dashboard / Page Notifikasi
      table.string('title', 100).notNullable()

      // Deskripsi detail aktivitas
      table.text('description').nullable()

      // Icon dan warna untuk frontend
      table.string('icon', 30).notNullable().defaultTo('doc')
      table.string('color', 20).notNullable().defaultTo('green')

      // Status sudah dibaca / belum dibaca
      table.boolean('is_read').notNullable().defaultTo(false)

      // Data tambahan opsional, misalnya projectId, clientId, materialId, fileId
      table.jsonb('metadata').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['user_id'])
      table.index(['module'])
      table.index(['action'])
      table.index(['is_read'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
