import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Meeting from './Meeting'

export default class MeetingLink extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public meetingId: number

  @column()
  public title: string

  @column()
  public url: string

  @belongsTo(() => Meeting)
  public meeting: BelongsTo<typeof Meeting>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
