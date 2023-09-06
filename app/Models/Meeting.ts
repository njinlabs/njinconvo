import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  HasMany,
  beforeDelete,
  belongsTo,
  column,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Classroom from './Classroom'
import MeetingLink from './MeetingLink'
import MeetingFile from './MeetingFile'

export default class Meeting extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public classroomId: number

  @column()
  public isDraft: boolean

  @belongsTo(() => Classroom)
  public classroom: BelongsTo<typeof Classroom>

  @hasMany(() => MeetingLink)
  public links: HasMany<typeof MeetingLink>

  @hasMany(() => MeetingFile)
  public files: HasMany<typeof MeetingFile>

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
