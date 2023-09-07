import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import MeetingAttendance from './MeetingAttendance'
import User from './User'

export default class AttendanceDetail extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public meetingAttendanceId: number

  @column()
  public userId: number

  @column()
  public status: string

  @belongsTo(() => MeetingAttendance)
  public attendance: BelongsTo<typeof MeetingAttendance>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
