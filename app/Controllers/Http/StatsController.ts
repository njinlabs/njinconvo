import Database from '@ioc:Adonis/Lucid/Database'
import Access from 'App/Models/Access'
import Group from 'App/Models/Group'
import Meeting from 'App/Models/Meeting'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

type AccessData = {
  date: DateTime
  total: number
}

export default class StatsController {
  public async index() {
    const accesses = await Access.query()
      .select(Database.raw('DATE(created_at) as access_date'))
      .sum('count')
      .groupBy('access_date')

    const data: AccessData[] = []
    for (let date = 9; date >= 0; date--) {
      const getDate = DateTime.now().minus({
        days: date,
      })
      const access = accesses.find(
        (value) =>
          DateTime.fromJSDate(value.$extras.access_date).toISODate() === getDate.toISODate()
      )
      data.push({
        date: getDate,
        total: Number(access?.$extras.sum || 0),
      })
    }

    const leads_count = Number(
      (await User.query().where('role', 'lead').count('* as total')).shift()?.$extras.total || 0
    )
    const participants_count = Number(
      (await User.query().where('role', 'participant').count('* as total')).shift()?.$extras
        .total || 0
    )
    const groups_count = Number(
      (await Group.query().count('* as total')).shift()?.$extras.total || 0
    )
    const meetings_count = Number(
      (await Meeting.query().count('* as total')).shift()?.$extras.total || 0
    )

    return {
      access_stats: data,
      leads_count,
      participants_count,
      groups_count,
      meetings_count,
    }
  }
}
