import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('start_date').nullable().after('deadline')
      table.string('team', 100).nullable().after('start_date')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('team')
      table.dropColumn('start_date')
    })
  }
}
