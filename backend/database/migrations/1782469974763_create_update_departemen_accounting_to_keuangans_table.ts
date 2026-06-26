import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw("UPDATE users SET departemen = 'Keuangan' WHERE departemen = 'Accounting'")
  }

  async down() {
    this.schema.raw("UPDATE users SET departemen = 'Accounting' WHERE departemen = 'Keuangan'")
  }
}
