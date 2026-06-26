// DATABASE REPORT

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('project_id').unsigned().nullable()
      table.integer('generated_by').unsigned().nullable()

      table.string('report_type', 50).notNullable()
      table.string('report_name', 100).notNullable()

      table.date('filter_start_date').nullable()
      table.date('filter_end_date').nullable()

      table.text('generated_file_path').nullable()

      table.timestamp('generated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['project_id'])
      table.index(['generated_by'])
      table.index(['report_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
