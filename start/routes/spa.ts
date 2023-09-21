import Route from '@ioc:Adonis/Core/Route'
import App from '@ioc:Adonis/Core/Application'
import { readFileSync } from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

Route.get('*', ({ response }: HttpContextContract) => {
  const spa = readFileSync(App.makePath('frontend', 'index.html'))

  return response.send(spa.toString())
})
