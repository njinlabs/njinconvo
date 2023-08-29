import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.group(() => {
    Route.get('/', 'AuthController.signIn')
    Route.delete('/', 'AuthController.signOut').middleware('auth:user')
  }).prefix('/sign')

  Route.get('/check-token', 'AuthController.checkToken').middleware('auth:user')
}).prefix('/auth')
