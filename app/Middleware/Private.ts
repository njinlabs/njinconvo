import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Private {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    role: string[] = ['administrator']
  ) {
    const user = auth.use('user').user!

    if (role[0] !== user.role) {
      return response.methodNotAllowed()
    }

    await next()
  }
}
