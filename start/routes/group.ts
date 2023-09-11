import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/code', 'GroupsController.show').middleware(['private:participant'])
  Route.post('/join', 'GroupsController.join').middleware(['private:participant'])

  Route.group(() => {
    Route.group(() => {
      Route.get('/self', 'AttendancesController.showSelf')
      Route.put('/self', 'AttendancesController.saveSelf').middleware('private:participant')
      Route.get('/', 'AttendancesController.show')
      Route.put('/', 'AttendancesController.save').middleware('private:lead')
    }).prefix('/:id/attendance')

    Route.delete('/:id', 'MeetingsController.destroy').middleware('private:lead')
    Route.put('/:id', 'MeetingsController.update').middleware('private:lead')
    Route.get('/:id', 'MeetingsController.show')
    Route.post('/', 'MeetingsController.store').middleware('private:lead')
    Route.get('/', 'MeetingsController.index')
  }).prefix('/:groupId/meeting')

  Route.delete('/:id/leave', 'GroupsController.leave').middleware('private:participant')
  Route.get('/:id/participants', 'GroupsController.participants')
  Route.delete('/:id', 'GroupsController.destroy').middleware('private:lead')
  Route.put('/:id', 'GroupsController.update').middleware('private:lead')
  Route.get('/:id', 'GroupsController.show')
  Route.post('/', 'GroupsController.store').middleware('private:lead')
  Route.get('/', 'GroupsController.index')
})
  .prefix('/group')
  .middleware('auth:user')
