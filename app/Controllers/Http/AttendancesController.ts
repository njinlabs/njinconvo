import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import Meeting from 'App/Models/Meeting'
import MeetingAttendance from 'App/Models/MeetingAttendance'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import AttendanceDetail from 'App/Models/AttendanceDetail'

export default class AttendancesController {
  private async getMeeting(
    auth: AuthContract,
    id: string | number,
    teacherOnly = false
  ): Promise<Meeting> {
    let meetingQuery: ModelQueryBuilderContract<typeof Meeting, Meeting> = Meeting.query().where(
      'meetings.id',
      id
    )

    if (auth.use('user').user!.role !== 'administrator') {
      meetingQuery.whereHas('classroom', (query) =>
        query.whereHas('users', (query) => {
          query.where('users.id', auth.use('user').user!.id)
          if (teacherOnly) {
            query.wherePivot('classroom_user.role', 'teacher')
          }
        })
      )
    }

    return (await meetingQuery.firstOrFail()) as Meeting
  }

  public async save({ auth, params, request }: HttpContextContract) {
    const meeting = await this.getMeeting(auth, params.id, true)

    const {
      allow_self_attendance: allowSelfAttendance,
      self_attendance_due: selfAttendanceDue,
      show_it_to_participants: showItToParticipants,
      details,
    } = await request.validate({
      schema: schema.create({
        allow_self_attendance: schema.boolean(),
        self_attendance_due: schema.date({ format: 'yyyy-MM-dd HH:mm:ss' }, [
          rules.requiredIfExists('allow_self_attendance'),
        ]),
        show_it_to_participants: schema.boolean(),
        details: schema.array().members(
          schema.object().members({
            user_id: schema.number(),
            status: schema.enum(['present', 'sick', 'permission', 'absent']),
          })
        ),
      }),
    })

    return await Database.transaction(async (trx) => {
      const attendance = await MeetingAttendance.firstOrNew(
        {
          meetingId: meeting.id,
        },
        {
          allowSelfAttendance,
          selfAttendanceDue,
          showItToParticipants,
        },
        {
          client: trx,
        }
      )

      if (!attendance.$isNew) {
        attendance.allowSelfAttendance = allowSelfAttendance
        attendance.selfAttendanceDue = selfAttendanceDue
        attendance.showItToParticipants = showItToParticipants
      }

      await attendance.save()

      await meeting.load('classroom')
      await meeting.classroom.load('users')

      for (const detail of details.filter((detail) =>
        meeting.classroom.users.map((item) => item.id).includes(detail.user_id)
      )) {
        await AttendanceDetail.firstOrCreate(
          {
            userId: detail.user_id,
            meetingAttendanceId: attendance.id,
          },
          {
            status: detail.status,
          },
          {
            client: trx,
          }
        )
      }

      await attendance.load('details')

      return attendance.serialize()
    })
  }

  public async show({ auth, params }: HttpContextContract) {
    const meeting = await this.getMeeting(auth, params.id)
    const attendance = await MeetingAttendance.query()
      .where('meeting_attendances.meeting_id', meeting.id)
      .preload('details')
      .firstOrFail()

    return attendance.serialize()
  }
}
