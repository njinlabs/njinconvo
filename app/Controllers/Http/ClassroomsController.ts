import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Classroom from 'App/Models/Classroom'

export default class ClassroomsController {
  public async store({ request, auth }: HttpContextContract) {
    const { name } = await request.validate({
      schema: schema.create({
        name: schema.string(),
      }),
    })

    return Database.transaction(async (trx) => {
      const classroom = await Classroom.create(
        {
          name,
        },
        {
          client: trx,
        }
      )

      await classroom.related('users').attach({
        [auth.use('user').user!.id]: {
          role: 'teacher',
        },
      })

      return classroom.serialize()
    })
  }
}
