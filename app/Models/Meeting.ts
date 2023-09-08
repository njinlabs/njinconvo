import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  HasMany,
  HasManyThrough,
  HasOne,
  beforeDelete,
  belongsTo,
  column,
  hasMany,
  hasManyThrough,
  hasOne,
} from '@ioc:Adonis/Lucid/Orm'
import Group from './Group'
import MeetingLink from './MeetingLink'
import MeetingFile from './MeetingFile'
import MeetingAttendance from './MeetingAttendance'
import AttendanceDetail from './AttendanceDetail'

export default class Meeting extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public groupId: number

  @column()
  public isDraft: boolean

  @belongsTo(() => Group)
  public group: BelongsTo<typeof Group>

  @hasMany(() => MeetingLink)
  public links: HasMany<typeof MeetingLink>

  @hasMany(() => MeetingFile)
  public files: HasMany<typeof MeetingFile>

  @hasOne(() => MeetingAttendance)
  public attendance: HasOne<typeof MeetingAttendance>

  @hasManyThrough([() => AttendanceDetail, () => MeetingAttendance])
  public attendance_details: HasManyThrough<typeof AttendanceDetail>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeDelete()
  public static async deleteFile(meeting: Meeting) {
    const files = await meeting.related('files').query()
    for (const file of files) {
      await file.delete()
    }
  }
}
