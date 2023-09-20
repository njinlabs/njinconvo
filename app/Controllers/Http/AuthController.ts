import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Access from 'App/Models/Access'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AuthController {
  public async signIn({ auth, request, response }: HttpContextContract) {
    const { email, password } = await request.validate({
      schema: schema.create({
        email: schema.string({}, [rules.email()]),
        password: schema.string(),
      }),
    })

    const user = await User.findByOrFail('email', email)

    if (!(await Hash.verify(user.password, password))) {
      return response.unauthorized()
    }

    const { token } = await auth.use('user').generate(user)

    return {
      ...user.serialize(),
      token,
    }
  }

  public async signOut({ auth }: HttpContextContract) {
    const user = auth.use('user').user!
    await auth.use('user').revoke()

    return user.serialize()
  }

  public async checkToken({ auth }: HttpContextContract) {
    return Database.transaction(async (trx) => {
      let access =
        (await Access.query()
          .useTransaction(trx)
          .where('user_id', auth.use('user').user!.id)
          .where('created_at', '>=', DateTime.now().toSQLDate()!)
          .forUpdate()
          .noWait()
          .first()) || new Access()

      access.userId = auth.use('user').user!.id
      access.count = Number(access.count || 0) + 1

      await access.useTransaction(trx).save()

      return auth.use('user').user!.serialize()
    })
  }
}
