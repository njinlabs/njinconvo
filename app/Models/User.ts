import { AttachmentContract, attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, ManyToMany, beforeSave, column, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Classroom from './Classroom'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public fullname: string

  @attachment({ preComputeUrl: true })
  public avatar: AttachmentContract

  @column()
  public gender: string

  @column()
  public birthday: DateTime

  @column()
  public role: string

  @manyToMany(() => Classroom, {
    pivotColumns: ['role'],
  })
  public classrooms: ManyToMany<typeof Classroom>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  public serializeExtras() {
    return {
      classroom_role: this.$extras.pivot_role || undefined,
    }
  }
}
