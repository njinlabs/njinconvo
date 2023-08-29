import { DateTime } from 'luxon'
import { BaseModel, ManyToMany, beforeCreate, column, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class Classroom extends BaseModel {
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
  public static async generateCode(classroom: Classroom) {
    let code = this.randomize()
    while (await Classroom.findBy('code', code)) {
      code = this.randomize()
    }

    classroom.code = code
  }
}
