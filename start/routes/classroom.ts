import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('/', 'ClassroomsController.store').middleware(['auth:user', 'private:teacher'])
}).prefix('/classroom')
