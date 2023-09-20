import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.put('/change-password', 'UsersController.changePassword').middleware(['auth:user'])
  Route.put('/profile', 'UsersController.updateProfile').middleware(['auth:user'])
  Route.delete('/:id', 'UsersController.destroy').middleware(['auth:user', 'private:administrator'])
  Route.get('/:id', 'UsersController.show').middleware(['auth:user', 'private:administrator'])
  Route.put('/:id', 'UsersController.update').middleware(['auth:user', 'private:administrator'])
  Route.post('/', 'UsersController.store').middleware(['auth:user', 'private:administrator'])
  Route.get('/', 'UsersController.index').middleware(['auth:user', 'private:administrator'])
}).prefix('/user')
