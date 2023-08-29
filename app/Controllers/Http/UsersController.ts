import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {
  public async index({ request }: HttpContextContract) {
    const page = Number(request.input('page', '1'))
    const limit = 50

    const usersQuery = User.query()
    const usersCount = await usersQuery.clone().count('* as count')
    const users = await usersQuery
      .clone()
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(usersCount[0].$extras.count) / limit),
      data: users.map((user) => user.serialize()),
    }
  }
}
