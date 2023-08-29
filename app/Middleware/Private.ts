import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Private {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    roles: string[] = ['administrator']
  ) {
    const user = auth.use('user').user!

    if (!roles.includes(user.role)) {
      return response.methodNotAllowed()
    }

    await next()
  }
}
