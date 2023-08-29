import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/:id', 'UsersController.show').middleware(['auth:user', 'private:administrator'])
  Route.put('/:id', 'UsersController.update').middleware(['auth:user', 'private:administrator'])
  Route.post('/', 'UsersController.store').middleware(['auth:user', 'private:administrator'])
  Route.get('/', 'UsersController.index').middleware(['auth:user', 'private:administrator'])
}).prefix('/user')
