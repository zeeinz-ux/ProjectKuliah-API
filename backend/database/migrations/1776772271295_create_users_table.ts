import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('full_name', 100).notNullable()
      table.string('email', 100).notNullable().unique()
      table.string('password', 150).notNullable()

      table
        .enum('role', ['admin', 'project_manager', 'finance'], {
          useNative: true,
          enumName: 'user_role_enum',
          existingType: false,
        })
        .notNullable()

      table
        .enum('departemen', ['Super User', 'Operator Data', 'Keuangan'], {
          useNative: true,
          enumName: 'user_departemen_enum',
          existingType: false,
        })
        .notNullable()

      table.boolean('is_active').notNullable().defaultTo(true)
      table.text('bio').nullable()
      table.string('avatar').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS user_role_enum')
    this.schema.raw('DROP TYPE IF EXISTS user_departemen_enum')
  }
}
