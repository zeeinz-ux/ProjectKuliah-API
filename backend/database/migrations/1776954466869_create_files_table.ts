// DATABASE FILE

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('project_id').unsigned().nullable()
      table.integer('uploaded_by').unsigned().nullable()

      table.string('original_name', 255).notNullable()
      table.string('stored_name', 255).notNullable()
      table.text('file_path').notNullable()

      table.string('mime_type', 50).notNullable()
      table.bigInteger('file_size').notNullable().defaultTo(0)

      table.string('category', 50).notNullable().defaultTo('Dokumen Lain')

      table.timestamp('uploaded_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['project_id'])
      table.index(['uploaded_by'])
      table.index(['category'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
