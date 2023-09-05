import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/code', 'ClassroomsController.show').middleware(['private:student'])
  Route.post('/join', 'ClassroomsController.join').middleware(['private:student'])

  Route.group(() => {
    Route.post('/meeting', 'MeetingsController.store').middleware('private:teacher')
    Route.get('/meeting', 'MeetingsController.index')
  }).prefix('/:classroomId')

  Route.get('/:id/participants', 'ClassroomsController.participants')
  Route.get('/:id', 'ClassroomsController.show')
  Route.post('/', 'ClassroomsController.store').middleware(['private:teacher'])
  Route.get('/', 'ClassroomsController.index')
})
  .prefix('/classroom')
  .middleware('auth:user')
