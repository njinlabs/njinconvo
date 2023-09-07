import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, belongsTo, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Meeting from './Meeting'
import AttendanceDetail from './AttendanceDetail'

export default class MeetingAttendance extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public meetingId: number

  @column()
  public allowSelfAttendance: boolean

  @column.dateTime()
  public selfAttendanceDue: DateTime

  @column()
  public showItToParticipants: boolean

  @belongsTo(() => Meeting)
  public meeting: BelongsTo<typeof Meeting>

  @hasMany(() => AttendanceDetail)
  public details: HasMany<typeof AttendanceDetail>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
