import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

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
    return auth.use('user').user!.serialize()
  }
}
