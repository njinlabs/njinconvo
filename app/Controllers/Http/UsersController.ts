import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Database from '@ioc:Adonis/Lucid/Database'

export default class UsersController {
  public async index({ request }: HttpContextContract) {
    const {
      page = 1,
      search,
      order,
      direction = 'asc',
    } = await request.validate({
      schema: schema.create({
        page: schema.number.optional(),
        search: schema.string.optional(),
        order: schema.enum.optional(['fullname', 'email', 'gender', 'role', 'birthday']),
        direction: schema.enum.optional(['asc', 'desc']),
      }),
    })

    const limit = 50

    const usersQuery = User.query().whereNot('role', 'administrator')

    if (search) {
      usersQuery.where((query) => {
        query.whereILike('fullname', `%${search}%`).orWhereILike('email', `%${search}%`)
      })
    }

    const usersCount = await usersQuery.clone().count('* as count')
    const users = await usersQuery
      .clone()
      .orderBy(order || 'users.id', direction as 'asc' | 'desc' | undefined)
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(usersCount[0].$extras.count) / limit),
      data: users.map((user) => user.serialize()),
    }
  }

  public async store({ request }: HttpContextContract) {
    const { email, password, fullname, gender, role, birthday } = await request.validate({
      schema: schema.create({
        email: schema.string({}, [rules.email()]),
        password: schema.string.optional(),
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        role: schema.enum(['lead', 'participant']),
        birthday: schema.date(),
      }),
    })

    const user = new User()
    user.email = email.toLowerCase()
    user.password = password || email
    user.fullname = fullname
    user.gender = gender
    user.role = role
    user.birthday = birthday

    await user.save()

    return user.serialize()
  }

  public async update({ request, params }: HttpContextContract) {
    const { email, password, fullname, gender, role, birthday } = await request.validate({
      schema: schema.create({
        email: schema.string({}, [rules.email()]),
        password: schema.string.optional(),
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        role: schema.enum(['administrator', 'lead', 'participant']),
        birthday: schema.date(),
      }),
    })

    const user = await User.query()
      .where('id', params.id)
      .whereNot('role', 'administrator')
      .firstOrFail()
    user.email = email.toLowerCase()
    user.fullname = fullname
    user.gender = gender
    user.role = role
    user.birthday = birthday

    if (password) {
      user.password = password
    }

    await user.save()

    return user.serialize()
  }

  public async show({ params }: HttpContextContract) {
    const user = await User.findOrFail(params.id)

    return user.serialize()
  }

  public async destroy({ params }: HttpContextContract) {
    const user = await User.query()
      .where('id', params.id)
      .whereNot('role', 'administrator')
      .firstOrFail()
    await user.delete()

    return user.serialize()
  }

  public async updateProfile({ request, auth }: HttpContextContract) {
    const { fullname, gender, birthday, avatar } = await request.validate({
      schema: schema.create({
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        birthday: schema.date(),
        avatar: schema.file.optional({
          extnames: ['jpg', 'jpeg', 'png'],
          size: '2mb',
        }),
      }),
    })

    const user = await auth.use('user').user!
    user.fullname = fullname
    user.gender = gender
    user.birthday = birthday

    if (avatar) {
      user.avatar = Attachment.fromFile(avatar)
    }

    await user.save()

    return user.serialize()
  }

  public async changePassword({ auth, request, response }: HttpContextContract) {
    const { oldPassword, newPassword } = await request.validate({
      schema: schema.create({
        oldPassword: schema.string(),
        newPassword: schema.string(),
      }),
    })

    if (!(await Hash.verify(auth.use('user').user!.password, oldPassword))) {
      return response.unauthorized()
    }

    auth.use('user').user!.password = newPassword
    await auth.use('user').user!.save()

    await Database.query().from('api_tokens').where('user_id', auth.use('user').user!.id).delete()

    return auth.use('user').user!.serialize()
  }
}
