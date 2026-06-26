import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relasi ke tabel clients
      table
        .integer('client_id')
        .unsigned()
        .references('id')
        .inTable('clients')
        .onDelete('CASCADE')
        .notNullable()

      // Data utama proyek
      table.string('name', 100).notNullable()
      table.string('status', 30).notNullable().defaultTo('progress')
      table.integer('progress').notNullable().defaultTo(0)

      // Detail proyek
      table.string('cover', 255).nullable()
      table.string('location', 100).nullable()
      table.date('deadline').nullable()
      table.bigInteger('budget').notNullable().defaultTo(0)
      table.text('overview').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
