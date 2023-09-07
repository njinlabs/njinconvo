import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'attendance_details'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('meeting_attendance_id')
        .unsigned()
        .references('id')
        .inTable('meeting_attendances')
        .onDelete('cascade')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.enum('status', ['present', 'sick', 'permission', 'absent'])

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
