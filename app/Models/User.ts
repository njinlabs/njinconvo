import { AttachmentContract, attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  BaseModel,
  HasMany,
  ManyToMany,
  beforeSave,
  column,
  hasMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import AttendanceDetail from './AttendanceDetail'
import Group from './Group'

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

  @manyToMany(() => Group, {
    pivotColumns: ['role'],
  })
  public groups: ManyToMany<typeof Group>

  @hasMany(() => AttendanceDetail)
  public attendances: HasMany<typeof AttendanceDetail>

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
      group_role: this.$extras.pivot_role || undefined,
    }
  }
}
