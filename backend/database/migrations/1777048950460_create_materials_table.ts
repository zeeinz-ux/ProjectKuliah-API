import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'materials'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.string('name', 100).notNullable()
      table.text('description').nullable()
      table.string('category', 50).notNullable()
      table.string('sku', 30).notNullable().unique()
      table.integer('stock').notNullable().defaultTo(0)
      table.string('unit', 20).notNullable().defaultTo('pcs')
      table.bigInteger('price').notNullable().defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
