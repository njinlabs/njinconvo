import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Group from 'App/Models/Group'

export default class GroupsController {
  public async store({ request, auth }: HttpContextContract) {
    const { name } = await request.validate({
      schema: schema.create({
        name: schema.string(),
      }),
    })

    return Database.transaction(async (trx) => {
      const group = await Group.create(
        {
          name,
        },
        {
          client: trx,
        }
      )

      await group.related('users').attach({
        [auth.use('user').user!.id]: {
          role: 'lead',
        },
      })

      return group.serialize()
    })
  }

  public async index({ request, auth }: HttpContextContract) {
    const page = Number(request.input('page', '1'))
    const limit = 50
    const role = auth.use('user').user!.role

    const groupsQuery = Group.query()

    if (role !== 'administrator') {
      groupsQuery.whereHas('users', (query) => query.where('users.id', auth.use('user').user!.id))
    }

    const groupsCount = await groupsQuery.clone().count('* as count')
    const groups = await groupsQuery
      .clone()
      .preload('users', (query) => query.wherePivot('role', 'lead'))
      .withCount('users')
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(groupsCount[0].$extras.count) / limit),
      data: groups.map((group) => {
        const { users, ...groupData } = group.serialize()

        return {
          ...groupData,
          lead: users[0] || null,
          participants: Number(group.$extras.users_count),
        }
      }),
    }
  }

  public async join({ request, auth }: HttpContextContract) {
    const { code } = await request.validate({
      schema: schema.create({
        code: schema.string(),
      }),
    })

    const group = await Group.findByOrFail('code', code)

    await group.related('users').attach({
      [auth.use('user').user!.id]: {
        role: 'participant',
      },
    })

    return group.serialize()
  }

  public async show({ auth, params, request }: HttpContextContract) {
    const role = auth.use('user').user!.role

    const groupsQuery = Group.query().withCount('users')

    if (!params.id) {
      groupsQuery.where('code', request.input('code', null))
    } else {
      groupsQuery.where('id', params.id)
    }

    if (role !== 'administrator' && params.id) {
      groupsQuery.whereHas('users', (query) => query.where('users.id', auth.use('user').user!.id))
    }

    if (role !== 'administrator') {
      groupsQuery.preload('users', (query) =>
        query.wherePivot('role', 'lead').orWhere('users.id', auth.use('user').user!.id)
      )
    } else {
      groupsQuery.preload('users', (query) => query.wherePivot('role', 'lead'))
    }

    const group = await groupsQuery.firstOrFail()

    const { users, ...groupData } = group.serialize()

    return {
      ...groupData,
      lead: ((users as Array<any>) || []).find((el) => el.group_role === 'lead') || null,
      participants: Number(group.$extras.users_count),
      has_joined:
        role !== 'administrator'
          ? ((users as Array<any>) || []).find((el) => el.id === auth.use('user').user!.id) || null
          : undefined,
    }
  }

  public async participants({ params, auth }: HttpContextContract) {
    const role = auth.use('user').user!.role
    const groupQuery = Group.query().where('id', params.id)

    if (role !== 'administrator') {
      groupQuery.whereHas('users', (query) => query.where('users.id', auth.use('user').user!.id))
    }

    const group = await groupQuery.firstOrFail()

    const participants = await group.related('users').query()

    return participants.map((user) => user.serialize())
  }

  public async destroy({ auth, params }: HttpContextContract) {
    const group = await auth
      .use('user')
      .user!.related('groups')
      .query()
      .where('groups.id', params.id)
      .wherePivot('group_user.role', 'lead')
      .firstOrFail()

    await group.delete()

    return group.serialize()
  }

  public async leave({ auth, params }: HttpContextContract) {
    const group = await auth
      .use('user')
      .user!.related('groups')
      .query()
      .where('groups.id', params.id)
      .wherePivot('group_user.role', 'participant')
      .firstOrFail()
    await auth.use('user').user!.related('groups').detach([group.id])

    return group.serialize()
  }
}
