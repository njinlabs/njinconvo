import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'meeting_attendances'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('meeting_id')
        .unsigned()
        .references('id')
        .inTable('meetings')
        .onDelete('cascade')
      table.boolean('allow_self_attendance')
      table.dateTime('self_attendance_due', { useTz: true }).nullable()
      table.boolean('show_it_to_participants')

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
