import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'StatsController.index').middleware('private:administrator')
})
  .prefix('/stats')
  .middleware('auth:user')
