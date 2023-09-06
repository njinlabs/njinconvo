import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { ManyToManyQueryBuilderContract, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import Classroom from 'App/Models/Classroom'
import Meeting from 'App/Models/Meeting'
import MeetingLink from 'App/Models/MeetingLink'

export default class MeetingsController {
  private async getClassroom(
    auth: AuthContract,
    id: string | number,
    teacherOnly = false
  ): Promise<Classroom> {
    let classroomQuery:
      | ManyToManyQueryBuilderContract<typeof Classroom, Classroom>
      | ModelQueryBuilderContract<typeof Classroom, Classroom> = Classroom.query().where(
      'classrooms.id',
      id
    )

    if (auth.use('user').user!.role !== 'administrator') {
      classroomQuery = auth
        .use('user')
        .user!.related('classrooms')
        .query()
        .where('classrooms.id', id)

      if (teacherOnly) {
        ;(classroomQuery as ManyToManyQueryBuilderContract<typeof Classroom, Classroom>).wherePivot(
          'classroom_user.role',
          'teacher'
        )
      }
    }

    return (await classroomQuery.firstOrFail()) as Classroom
  }

  public async index({ auth, params, request }: HttpContextContract) {
    const classroom = await this.getClassroom(auth, params.classroomId)

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
    const classroom = await this.getClassroom(auth, params.classroomId, true)

    const {
      title,
      description,
      is_draft: isDraft,
      links,
    } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        description: schema.string(),
        is_draft: schema.boolean(),
        links: schema.array.optional().members(
          schema.object().members({
            title: schema.string(),
            url: schema.string({}, [rules.url()]),
          })
        ),
      }),
    })

    return await Database.transaction(async () => {
      const meeting = await Meeting.create({
        title,
        description,
        isDraft,
      })

      let meetingLinks: MeetingLink[] = []
      if (links?.length) {
        meetingLinks = await MeetingLink.createMany(
          links.map((link) => ({ ...link, meetingId: meeting.id }))
        )
      }

      await meeting.related('classroom').associate(classroom)

      return { ...meeting.serialize(), links: meetingLinks.map((link) => link.serialize()) }
    })
  }

  public async show({ auth, params }: HttpContextContract) {
    const classroom = await this.getClassroom(auth, params.classroomId)

    const meetingQuery = classroom.related('meetings').query().where('meetings.id', params.id)

    if (classroom.$extras.pivot_role === 'student') {
      meetingQuery.where('meetings.is_draft', false)
    }

    const meeting = await meetingQuery.preload('links').firstOrFail()

    return {
      ...meeting.serialize(),
      classroom: {
        ...classroom.serialize(),
        classroom_role: classroom.$extras.pivot_role,
      },
    }
  }

  public async update({ auth, params, request }: HttpContextContract) {
    const classroom = await this.getClassroom(auth, params.classroomId, true)
    const meeting = await classroom
      .related('meetings')
      .query()
      .where('meetings.id', params.id)
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

    meeting.title = title
    meeting.description = description
    meeting.isDraft = isDraft

    await meeting.save()

    return meeting.serialize()
  }

  public async destroy({ auth, params }: HttpContextContract) {
    const classroom = await this.getClassroom(auth, params.classroomId)
    const meeting = await classroom
      .related('meetings')
      .query()
      .where('meetings.id', params.id)
      .firstOrFail()
    await meeting.delete()

    return meeting.serialize()
  }
}
