import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run() {
    // Write your database queries inside the run method
    await User.create({
      email: 'admin@example.com',
      password: '123456',
      fullname: 'Administrator',
      gender: 'male',
      birthday: DateTime.now(),
      role: 'administrator',
    })
  }
}
