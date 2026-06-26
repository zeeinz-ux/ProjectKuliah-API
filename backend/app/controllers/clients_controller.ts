import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Client from '#models/client'
import { createActivityLog } from '#services/activity_log_service'

function formatDateValue(value: any) {
  if (!value) return null

  if (typeof value?.toISODate === 'function') {
    return value.toISODate()
  }

  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  return null
}

function getCurrentUserId(ctx: HttpContext) {
  const user = (ctx as any).auth?.user
  return user?.id ? Number(user.id) : null
}

export default class ClientsController {
  // =========================
  // GET /api/clients
  // Ambil data client + hitung Orders dan Total Budget dari projects
  // =========================
  async index({ response }: HttpContext) {
    const clients = await Client.query().orderBy('created_at', 'desc')

    const data = await Promise.all(
      clients.map(async (client) => {
        const summary = await db
          .from('projects')
          .leftJoin('project_materials', 'projects.id', 'project_materials.project_id')
          .where('client_id', client.id)
          .countDistinct('projects.id as project_count')
          .sum('projects.budget as total_budget')
          .sum('project_materials.subtotal as total_material_cost')
          .first()

        const projectCount = Number(summary?.project_count || 0)
        const totalBudget = Number(summary?.total_budget || 0)
        const totalMaterialCost = Number(summary?.total_material_cost || 0)
        const totalSpent = totalBudget + totalMaterialCost

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          status: client.status,
          joined: formatDateValue(client.joined),

          projectCount,
          project_count: projectCount,
          orders: projectCount,

          totalSpent,
          total_spent: totalSpent,

          totalBudget,
          total_budget: totalBudget,
          totalMaterialCost,
          total_material_cost: totalMaterialCost,

          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        }
      })
    )

    return response.ok({
      message: 'Data client berhasil diambil.',
      data,
    })
  }

  // =========================
  // POST /api/clients
  // Tambah client baru
  // =========================
  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const payload = request.only([
      'name',
      'email',
      'phone',
      'address',
      'status',
      'joined',
      'total_spent',
    ])

    const existingClient = await Client.query().where('email', payload.email).first()

    if (existingClient) {
      return response.badRequest({
        message: 'Email client sudah digunakan.',
      })
    }

    const client = await Client.create({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      address: payload.address || null,
      status: payload.status || 'Active',
      joined: payload.joined ? DateTime.fromISO(payload.joined) : DateTime.now(),
      totalSpent: Number(payload.total_spent || 0),
    })

    await createActivityLog({
      userId,
      module: 'client',
      action: 'created',
      title: 'Client baru ditambahkan',
      description: `Client ${client.name} berhasil ditambahkan ke sistem.`,
      icon: 'user',
      color: 'cyan',
      metadata: {
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
      },
    })

    return response.created({
      message: 'Client berhasil ditambahkan.',
      data: client,
    })
  }

  // =========================
  // PUT /api/clients/:id
  // Update data client
  // =========================
  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const client = await Client.find(params.id)

    if (!client) {
      return response.notFound({
        message: 'Client tidak ditemukan.',
      })
    }

    const oldName = client.name
    const oldEmail = client.email

    const payload = request.only([
      'name',
      'email',
      'phone',
      'address',
      'status',
      'joined',
      'total_spent',
    ])

    if (payload.email && payload.email !== client.email) {
      const existingClient = await Client.query()
        .where('email', payload.email)
        .whereNot('id', client.id)
        .first()

      if (existingClient) {
        return response.badRequest({
          message: 'Email client sudah digunakan oleh client lain.',
        })
      }
    }

    client.name = payload.name ?? client.name
    client.email = payload.email ?? client.email
    client.phone = payload.phone ?? client.phone
    client.address = payload.address ?? client.address
    client.status = payload.status ?? client.status

    if (payload.joined !== undefined) {
      client.joined = payload.joined ? DateTime.fromISO(payload.joined) : client.joined
    }

    client.totalSpent =
      payload.total_spent !== undefined ? Number(payload.total_spent) : client.totalSpent

    await client.save()

    await createActivityLog({
      userId,
      module: 'client',
      action: 'updated',
      title: 'Data client diperbarui',
      description: `Data client ${client.name} berhasil diperbarui.`,
      icon: 'user',
      color: 'blue',
      metadata: {
        clientId: client.id,
        oldName,
        newName: client.name,
        oldEmail,
        newEmail: client.email,
      },
    })

    return response.ok({
      message: 'Client berhasil diperbarui.',
      data: client,
    })
  }

  // =========================
  // DELETE /api/clients/:id
  // Hapus client
  // =========================
  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const userId = getCurrentUserId(ctx)

    const client = await Client.find(params.id)

    if (!client) {
      return response.notFound({
        message: 'Client tidak ditemukan.',
      })
    }

    const deletedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
    }

    await client.delete()

    await createActivityLog({
      userId,
      module: 'client',
      action: 'deleted',
      title: 'Client dihapus',
      description: `Client ${deletedClient.name} berhasil dihapus dari sistem.`,
      icon: 'user',
      color: 'red',
      metadata: {
        clientId: deletedClient.id,
        clientName: deletedClient.name,
        clientEmail: deletedClient.email,
      },
    })

    return response.ok({
      message: 'Client berhasil dihapus.',
    })
  }
}
