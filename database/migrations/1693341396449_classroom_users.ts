import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'classroom_user'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('role')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table
        .integer('classroom_id')
        .unsigned()
        .references('id')
        .inTable('classrooms')
        .onDelete('cascade')

      table.unique(['user_id', 'classroom_id'])

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
