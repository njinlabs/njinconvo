import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/code', 'ClassroomsController.show').middleware(['auth:user', 'private:student'])
  Route.post('/join', 'ClassroomsController.join').middleware(['auth:user', 'private:student'])
  Route.get('/:id', 'ClassroomsController.show').middleware(['auth:user'])
  Route.post('/', 'ClassroomsController.store').middleware(['auth:user', 'private:teacher'])
  Route.get('/', 'ClassroomsController.index').middleware(['auth:user'])
}).prefix('/classroom')
