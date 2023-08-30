import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('/join', 'ClassroomsController.join').middleware(['auth:user', 'private:student'])
  Route.post('/', 'ClassroomsController.store').middleware(['auth:user', 'private:teacher'])
  Route.get('/', 'ClassroomsController.index').middleware(['auth:user'])
}).prefix('/classroom')
