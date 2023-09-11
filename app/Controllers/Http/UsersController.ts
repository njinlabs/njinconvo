import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class UsersController {
  public async index({ request }: HttpContextContract) {
    const page = Number(request.input('page', '1'))
    const limit = 50

    const usersQuery = User.query()
    const usersCount = await usersQuery.clone().count('* as count')
    const users = await usersQuery
      .clone()
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(usersCount[0].$extras.count) / limit),
      data: users.map((user) => user.serialize()),
    }
  }

  public async store({ request }: HttpContextContract) {
    const { email, password, fullname, gender, role, birthday, avatar } = await request.validate({
      schema: schema.create({
        email: schema.string({}, [rules.email()]),
        password: schema.string.optional(),
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        role: schema.enum(['administrator', 'lead', 'participant']),
        birthday: schema.date(),
        avatar: schema.file.optional({
          extnames: ['jpg', 'jpeg', 'png'],
          size: '2mb',
        }),
      }),
    })

    const user = new User()
    user.email = email.toLowerCase()
    user.password = password || email
    user.fullname = fullname
    user.gender = gender
    user.role = role
    user.birthday = birthday

    if (avatar) {
      user.avatar = Attachment.fromFile(avatar)
    }

    await user.save()

    return user.serialize()
  }

  public async update({ request, params }: HttpContextContract) {
    const { email, password, fullname, gender, role, birthday, avatar } = await request.validate({
      schema: schema.create({
        email: schema.string({}, [rules.email()]),
        password: schema.string.optional(),
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        role: schema.enum(['administrator', 'lead', 'participant']),
        birthday: schema.date(),
        avatar: schema.file.optional({
          extnames: ['jpg', 'jpeg', 'png'],
          size: '2mb',
        }),
      }),
    })

    const user = await User.findOrFail(params.id)
    user.email = email.toLowerCase()
    user.fullname = fullname
    user.gender = gender
    user.role = role
    user.birthday = birthday

    if (avatar) {
      user.avatar = Attachment.fromFile(avatar)
    }

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
    const user = await User.findOrFail(params.id)
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
}
