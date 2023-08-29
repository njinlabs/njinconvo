import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ClassroomPrivate {
  public async handle(
    { params, auth, response, ...ctx }: HttpContextContract,
    next: () => Promise<void>,
    roles: string[] = ['teacher', 'student']
  ) {
    const classroom = await auth
      .use('user')
      .user?.related('classrooms')
      .query()
      .where('id', params.id)
      .firstOrFail()

    if (!roles.includes(classroom?.$extras.pivot_role)) {
      return response.methodNotAllowed()
    }

    ctx.classroom = classroom!

    await next()
  }
}
