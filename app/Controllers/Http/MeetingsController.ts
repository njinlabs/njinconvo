import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Meeting from 'App/Models/Meeting'

export default class MeetingsController {
  public async index({ auth, params, request }: HttpContextContract) {
    const classroom = await auth
      .use('user')
      .user!.related('classrooms')
      .query()
      .where('classrooms.id', params.classroomId)
      .firstOrFail()

    const page = Number(request.input('page', '1'))
    const limit = 20

    const meetingsQuery = classroom.related('meetings').query()

    if (classroom.$extras.pivot_role === 'student') {
      meetingsQuery.where('meetings.is_draft', false)
    }

    const meetingsCount = await meetingsQuery.clone().count('* as count')
    const meetings = await meetingsQuery
      .clone()
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(meetingsCount[0].$extras.count) / limit),
      data: meetings.map((user) => user.serialize()),
    }
  }

  public async store({ auth, params, request }: HttpContextContract) {
    const classroom = await auth
      .use('user')
      .user!.related('classrooms')
      .query()
      .where('classrooms.id', params.classroomId)
      .wherePivot('classroom_user.role', 'teacher')
      .firstOrFail()

    const {
      title,
      description,
      is_draft: isDraft,
    } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        description: schema.string(),
        is_draft: schema.boolean(),
      }),
    })

    return await Database.transaction(async () => {
      const meeting = await Meeting.create({
        title,
        description,
        isDraft,
      })

      await meeting.related('classroom').associate(classroom)

      return meeting.serialize()
    })
  }
}
