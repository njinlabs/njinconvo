import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'UsersController.index').middleware(['auth:user', 'private:administrator'])
}).prefix('/user')
