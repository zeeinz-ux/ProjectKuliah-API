import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.string('name', 100).notNullable()
      table.string('email', 100).notNullable().unique()
      table.string('phone', 30).nullable()
      table.text('address').nullable()

      table.string('status', 20).notNullable().defaultTo('Active')
      table.date('joined').notNullable()

      table.bigInteger('total_spent').notNullable().defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
