import { DateTime } from 'luxon'
import {
  BaseModel,
  HasMany,
  ManyToMany,
  beforeCreate,
  beforeDelete,
  column,
  hasMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Meeting from './Meeting'

export default class Group extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public code: string

  @manyToMany(() => User, {
    pivotColumns: ['role'],
  })
  public users: ManyToMany<typeof User>

  @hasMany(() => Meeting)
  public meetings: HasMany<typeof Meeting>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  private static randomize(): string {
    const characters = '0123456789ABCDEF'
    let randomString = ''
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      randomString += characters[randomIndex]
    }
    return randomString
  }

  @beforeCreate()
  public static async generateCode(group: Group) {
    let code = this.randomize()
    while (await Group.findBy('code', code)) {
      code = this.randomize()
    }

    group.code = code
  }

  @beforeDelete()
  public static async removeMeeting(group: Group) {
    await group.load('meetings')

    for (const meeting of group.meetings) {
      await meeting.delete()
    }
  }
}
