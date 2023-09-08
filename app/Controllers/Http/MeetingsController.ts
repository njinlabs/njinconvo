import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import { AuthContract } from '@ioc:Adonis/Addons/Auth'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { ManyToManyQueryBuilderContract, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import Group from 'App/Models/Group'
import Meeting from 'App/Models/Meeting'
import MeetingFile from 'App/Models/MeetingFile'
import MeetingLink from 'App/Models/MeetingLink'

export default class MeetingsController {
  private async getGroup(
    auth: AuthContract,
    id: string | number,
    leadOnly = false
  ): Promise<Group> {
    let groupQuery:
      | ManyToManyQueryBuilderContract<typeof Group, Group>
      | ModelQueryBuilderContract<typeof Group, Group> = Group.query().where('groups.id', id)

    if (auth.use('user').user!.role !== 'administrator') {
      groupQuery = auth.use('user').user!.related('groups').query().where('groups.id', id)

      if (leadOnly) {
        ;(groupQuery as ManyToManyQueryBuilderContract<typeof Group, Group>).wherePivot(
          'group_user.role',
          'lead'
        )
      }
    }

    return (await groupQuery.firstOrFail()) as Group
  }

  public async index({ auth, params, request }: HttpContextContract) {
    const group = await this.getGroup(auth, params.groupId)

    const page = Number(request.input('page', '1'))
    const limit = 20

    const meetingsQuery = group.related('meetings').query()

    if (group.$extras.pivot_role === 'participant') {
      meetingsQuery.where('meetings.is_draft', false)
    }

    const meetingsCount = await meetingsQuery.clone().count('* as count')
    const meetings = await meetingsQuery
      .clone()
      .offset((page - 1) * limit)
      .limit(limit)

    return {
      page_total: Math.ceil(Number(meetingsCount[0].$extras.count) / limit),
      data: meetings.map((user) => user.serialize()),
    }
  }

  public async store({ auth, params, request }: HttpContextContract) {
    const group = await this.getGroup(auth, params.groupId, true)

    const {
      title,
      description,
      is_draft: isDraft,
      links,
      files,
    } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        description: schema.string(),
        is_draft: schema.boolean(),
        links: schema.array.optional().members(
          schema.object().members({
            title: schema.string(),
            url: schema.string({}, [rules.url()]),
          })
        ),
        files: schema.array.optional().members(
          schema.file({
            size: '10mb',
          })
        ),
      }),
    })

    return await Database.transaction(async (trx) => {
      const meeting = await Meeting.create(
        {
          title,
          description,
          isDraft,
        },
        {
          client: trx,
        }
      )

      let meetingLinks: MeetingLink[] = []
      if (links?.length) {
        meetingLinks = await MeetingLink.createMany(
          links.map((link) => ({ ...link, meetingId: meeting.id })),
          {
            client: trx,
          }
        )
      }

      let meetingFiles: MeetingFile[] = []
      if (files?.length) {
        meetingFiles = await MeetingFile.createMany(
          files.map((file) => ({
            file: Attachment.fromFile(file),
            meetingId: meeting.id,
          })),
          {
            client: trx,
          }
        )
      }

      await meeting.related('group').associate(group)

      return {
        ...meeting.serialize(),
        links: meetingLinks.map((link) => link.serialize()),
        files: meetingFiles.map((link) => link.serialize()),
      }
    })
  }

  public async show({ auth, params }: HttpContextContract) {
    const group = await this.getGroup(auth, params.groupId)

    const meetingQuery = group.related('meetings').query().where('meetings.id', params.id)

    if (group.$extras.pivot_role === 'participant') {
      meetingQuery.where('meetings.is_draft', false).preload('attendance')
    }

    const meeting = await meetingQuery.preload('links').preload('files').firstOrFail()

    return {
      ...meeting.serialize(),
      group: {
        ...group.serialize(),
        group_role: group.$extras.pivot_role,
      },
    }
  }

  public async update({ auth, params, request }: HttpContextContract) {
    return await Database.transaction(async (trx) => {
      const group = await this.getGroup(auth, params.groupId, true)
      const meeting = await group
        .related('meetings')
        .query()
        .useTransaction(trx)
        .where('meetings.id', params.id)
        .preload('links')
        .preload('files')
        .firstOrFail()

      const {
        title,
        description,
        is_draft: isDraft,
        links,
        files,
        old_files: oldFiles,
      } = await request.validate({
        schema: schema.create({
          title: schema.string(),
          description: schema.string(),
          is_draft: schema.boolean(),
          links: schema.array.optional().members(
            schema.object().members({
              id: schema.number.nullableAndOptional(),
              title: schema.string(),
              url: schema.string({}, [rules.url()]),
            })
          ),
          files: schema.array.optional().members(
            schema.file({
              size: '10mb',
            })
          ),
          old_files: schema.array.optional().members(schema.number()),
        }),
      })

      meeting.title = title
      meeting.description = description
      meeting.isDraft = isDraft

      await meeting.useTransaction(trx).save()

      const destroyLinks = meeting.links.filter(
        (item) => !links?.find((el) => `${el.id}` === `${item.id}`)
      )
      const addLinks = links?.filter((el) => !el.id)
      const setLinks = meeting.links.filter(
        (item) => links?.find((el) => `${el.id}` === `${item.id}`)
      )
      const destroyFiles = meeting.files.filter(
        (item) => !oldFiles?.find((el) => `${el}` === `${item.id}`)
      )

      for (const link of destroyLinks) {
        await link.useTransaction(trx).delete()
      }

      for (const link of setLinks) {
        const data = links?.find((el) => `${el.id}` === `${link.id}`)!
        await link.useTransaction(trx).merge({ title: data.title, url: data.url }).save()
      }

      if (addLinks?.length) {
        await MeetingLink.createMany(
          addLinks?.map((link) => ({ title: link.title, url: link.url, meetingId: meeting.id })),
          {
            client: trx,
          }
        )
      }

      for (const file of destroyFiles) {
        await file.useTransaction(trx).delete()
      }

      if (files?.length) {
        await MeetingFile.createMany(
          files.map((file) => ({ file: Attachment.fromFile(file), meetingId: meeting.id })),
          {
            client: trx,
          }
        )
      }

      await meeting.load('links')
      await meeting.load('files')

      return { ...meeting.serialize() }
    })
  }

  public async destroy({ auth, params }: HttpContextContract) {
    const group = await this.getGroup(auth, params.groupId)
    const meeting = await group
      .related('meetings')
      .query()
      .where('meetings.id', params.id)
      .firstOrFail()
    await meeting.delete()

    return meeting.serialize()
  }
}
