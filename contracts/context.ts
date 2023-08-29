declare module '@ioc:Adonis/Core/HttpContext' {
  import Classroom from 'App/Models/Classroom'

  interface HttpContextContract {
    classroom: Classroom | null
  }
}
