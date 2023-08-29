import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('/', 'UsersController.store').middleware(['auth:user', 'private:administrator'])
  Route.get('/', 'UsersController.index').middleware(['auth:user', 'private:administrator'])
}).prefix('/user')
