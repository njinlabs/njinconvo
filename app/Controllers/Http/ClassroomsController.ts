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

  public async index({ request, auth }: HttpContextContract) {
    const page = Number(request.input('page', '1'))
    const limit = 50
    const role = auth.use('user').user!.role

    const classroomsQuery = Classroom.query()

    if (role !== 'administrator') {
      classroomsQuery.whereHas('users', (query) =>
        query.where('users.id', auth.use('user').user!.id)
      )
    }

    const classroomsCount = await classroomsQuery.clone().count('* as count')
    const classrooms = await classroomsQuery
      .clone()
      .preload('users', (query) => query.wherePivot('role', 'teacher'))
      .withCount('users')
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(classroomsCount[0].$extras.count) / limit),
      data: classrooms.map((classroom) => {
        const { users, ...classroomData } = classroom.serialize()

        return {
          ...classroomData,
          teacher: users[0] || null,
          participants: Number(classroom.$extras.users_count),
        }
      }),
    }
  }

  public async join({ request, auth }: HttpContextContract) {
    const { code } = await request.validate({
      schema: schema.create({
        code: schema.string(),
      }),
    })

    const classroom = await Classroom.findByOrFail('code', code)

    await classroom.related('users').attach({
      [auth.use('user').user!.id]: {
        role: 'student',
      },
    })

    return classroom.serialize()
  }

  public async show({ auth, params, request }: HttpContextContract) {
    const role = auth.use('user').user!.role

    const classroomsQuery = Classroom.query()
      .preload('users', (query) => query.wherePivot('role', 'teacher'))
      .withCount('users')

    if (!params.id) {
      classroomsQuery.where('code', request.input('code', null))
    } else {
      classroomsQuery.where('id', params.id)
    }

    if (role !== 'administrator' && params.id) {
      classroomsQuery.whereHas('users', (query) =>
        query.where('users.id', auth.use('user').user!.id)
      )
    }

    const classroom = await classroomsQuery.firstOrFail()

    const { users, ...classroomData } = classroom.serialize()

    return {
      ...classroomData,
      teacher: users[0] || null,
      participants: Number(classroom.$extras.users_count),
    }
  }
}
