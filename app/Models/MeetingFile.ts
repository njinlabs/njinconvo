import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { AttachmentContract, attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import Meeting from './Meeting'

export default class MeetingFile extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public meetingId: number

  @attachment({ preComputeUrl: true })
  public file: AttachmentContract

  @belongsTo(() => Meeting)
  public meeting: BelongsTo<typeof Meeting>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
