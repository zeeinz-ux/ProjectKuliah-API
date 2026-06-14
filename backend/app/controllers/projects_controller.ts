// ============================================================
// PROJECTS CONTROLLER
// Medtic Interior Monitoring System
//
// FINAL FEATURE:
// ✅ Project CRUD
// ✅ Task progress support
// ✅ Progress photo support
// ✅ Project materials support
// ✅ Auto reduce stock material saat material dipakai di project
// ✅ Auto restore stock material saat project dihapus / material dikurangi
// ✅ Activity log / notification support
// ============================================================

import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import fs from 'node:fs'

import Project from '#models/project'
import Client from '#models/client'
import Material from '#models/material'
import ProjectMaterial from '#models/project_material'
import { createActivityLog } from '#services/activity_log_service'

// ============================================================
// HELPER: Ambil user login dengan aman
// Dibuat aman supaya tidak merah di TypeScript seperti kasus auth sebelumnya.
// ============================================================
function getCurrentUserId(ctx: HttpContext) {
  const authUser = (ctx as any).auth?.user
  const requestUser = (ctx.request as any).user

  const user = authUser || requestUser

  return user?.id ? Number(user.id) : null
}

// ============================================================
// HELPER: Aman ambil message error dari catch(error)
// Tujuannya supaya TypeScript tidak error karena error bertipe unknown
// ============================================================
function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

// ============================================================
// HELPER: Format date dari Luxon DateTime / string ke yyyy-mm-dd
// Dipakai untuk deadline dan response project
// ============================================================
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

// ============================================================
// HELPER: Timeline fallback otomatis dari progress project
// Catatan:
// Untuk versi frontend terbaru, timeline utama sudah dari task done.
// Ini tetap disediakan agar response lama tetap aman.
// ============================================================
function buildAutoTimeline(project: Project) {
  const progress = Number(project.progress || 0)

  return [
    {
      id: 'created',
      date: formatDateValue(project.createdAt) || '-',
      label: 'Project Dibuat',
      done: progress >= 0,
    },
    {
      id: 'started',
      date: progress >= 1 ? 'Progress dimulai' : '-',
      label: 'Pengerjaan Dimulai',
      done: progress >= 1,
    },
    {
      id: 'half',
      date: progress >= 50 ? 'Progress mencapai 50%' : '-',
      label: 'Progress 50%',
      done: progress >= 50,
    },
    {
      id: 'finishing',
      date: progress >= 80 ? 'Tahap finishing' : '-',
      label: 'Tahap Finishing',
      done: progress >= 80,
    },
    {
      id: 'completed',
      date: progress >= 100 ? 'Project selesai' : '-',
      label: 'Project Selesai',
      done: progress >= 100,
    },
  ]
}

// ============================================================
// ✅ MATERIAL PROJECT HELPER
// Normalisasi payload material dari frontend
//
// Frontend mengirim:
// materials: [
//   { materialId: 1, quantity: 5 },
//   { materialId: 2, quantity: 3 }
// ]
//
// Helper ini juga menggabungkan material yang sama
// supaya tidak ada duplikasi materialId.
// ============================================================
function normalizeMaterialPayload(rawMaterials: any[]) {
  if (!Array.isArray(rawMaterials)) return []

  const materialMap = new Map<number, number>()

  rawMaterials.forEach((item) => {
    const materialId = Number(item.materialId || item.material_id || item.id || 0)
    const quantity = Number(item.quantity || item.qty || 0)

    if (materialId > 0 && quantity > 0) {
      materialMap.set(materialId, (materialMap.get(materialId) || 0) + quantity)
    }
  })

  return Array.from(materialMap.entries()).map(([materialId, quantity]) => ({
    materialId,
    quantity,
  }))
}

// ============================================================
// ✅ MATERIAL PROJECT HELPER
// Membuat row project_materials dari payload frontend
//
// Price selalu diambil dari tabel materials.
// Subtotal = price * quantity.
// ============================================================
async function buildProjectMaterialRows(projectId: number, rawMaterials: any[]) {
  const normalizedMaterials = normalizeMaterialPayload(rawMaterials)

  if (normalizedMaterials.length === 0) {
    return []
  }

  const materialIds = normalizedMaterials.map((item) => item.materialId)

  const materials = await Material.query().whereIn('id', materialIds)
  const materialMap = new Map(materials.map((material) => [material.id, material]))

  if (materials.length !== materialIds.length) {
    throw new Error('Ada material yang tidak ditemukan di stok material.')
  }

  return normalizedMaterials.map((item) => {
    const material = materialMap.get(item.materialId)

    if (!material) {
      throw new Error('Ada material yang tidak ditemukan di stok material.')
    }

    const price = Number(material.price || 0)
    const quantity = Number(item.quantity || 0)
    const subtotal = price * quantity

    return {
      projectId,
      materialId: item.materialId,
      quantity,
      price,
      subtotal,
    }
  })
}

// ============================================================
// ✅ AUTO STOCK OUT HELPER - FINAL FIX
//
// Fungsi ini mengatur stok material saat project disimpan / diedit.
//
// Cara kerja:
// - Jika qty material bertambah, stok dikurangi dan stock_out bertambah.
// - Jika qty material berkurang, stok dikembalikan hanya sebesar stock_out yang valid.
// - Kalau data lama belum pernah punya stock_out, sistem tidak akan restore berlebihan.
// ============================================================
async function applyMaterialStockChanges(projectId: number, nextRows: any[]) {
  const oldRows = await ProjectMaterial.query().where('project_id', projectId)

  const oldQtyMap = new Map<number, number>()
  const nextQtyMap = new Map<number, number>()

  oldRows.forEach((row) => {
    oldQtyMap.set(row.materialId, (oldQtyMap.get(row.materialId) || 0) + Number(row.quantity || 0))
  })

  nextRows.forEach((row) => {
    nextQtyMap.set(
      row.materialId,
      (nextQtyMap.get(row.materialId) || 0) + Number(row.quantity || 0)
    )
  })

  const materialIds = [...new Set([...oldQtyMap.keys(), ...nextQtyMap.keys()])]

  for (const materialId of materialIds) {
    const material = await Material.find(materialId)

    if (!material) {
      throw new Error('Ada material yang tidak ditemukan di stok material.')
    }

    const oldQtyRaw = oldQtyMap.get(materialId) || 0
    const nextQty = nextQtyMap.get(materialId) || 0
    const currentStock = Number(material.stock || 0)
    const currentStockOut = Number(material.stockOut || 0)

    const effectiveOldQty = Math.min(oldQtyRaw, currentStockOut)
    const delta = nextQty - effectiveOldQty

    if (delta === 0) continue

    if (delta > 0) {
      if (currentStock < delta) {
        throw new Error(`Stok material "${material.name}" tidak cukup.`)
      }

      material.stock = currentStock - delta
      material.stockOut = currentStockOut + delta
    }

    if (delta < 0) {
      const requestedReturnQty = Math.abs(delta)
      const safeReturnQty = Math.min(requestedReturnQty, currentStockOut)

      material.stock = currentStock + safeReturnQty
      material.stockOut = Math.max(0, currentStockOut - safeReturnQty)
    }

    await material.save()
  }
}

// ============================================================
// ✅ SYNC PROJECT MATERIALS
//
// Dipakai di store() dan update().
// Fungsi ini:
// 1. Build row material baru
// 2. Apply perubahan stock
// 3. Hapus data project_materials lama
// 4. Simpan data project_materials baru
// ============================================================
async function syncProjectMaterials(projectId: number, rawMaterials: any[]) {
  const rows = await buildProjectMaterialRows(projectId, rawMaterials)

  await applyMaterialStockChanges(projectId, rows)

  await ProjectMaterial.query().where('project_id', projectId).delete()

  if (rows.length > 0) {
    await ProjectMaterial.createMany(rows)
  }
}

// ============================================================
// ✅ RESTORE STOCK MATERIAL - FINAL FIX
//
// Dipakai saat project dihapus.
// ============================================================
async function restoreProjectMaterialsStock(projectId: number) {
  const rows = await ProjectMaterial.query().where('project_id', projectId)

  for (const row of rows) {
    const material = await Material.find(row.materialId)

    if (!material) continue

    const quantity = Number(row.quantity || 0)
    const currentStock = Number(material.stock || 0)
    const currentStockOut = Number(material.stockOut || 0)

    const safeReturnQty = Math.min(quantity, currentStockOut)

    material.stock = currentStock + safeReturnQty
    material.stockOut = Math.max(0, currentStockOut - safeReturnQty)

    await material.save()
  }
}

// ============================================================
// HELPER: Hapus semua file foto dari progress logs suatu project
// Dipanggil sebelum project.delete() supaya tidak ada file orphan
// di public/uploads/progress/
// ============================================================
function deleteProgressLogImages(project: Project) {
  const logs = project.progressLogs || []

  for (const log of logs) {
    if (!log.image) continue

    const cleanPath = String(log.image).replace(/^\/+/, '')

    if (!cleanPath.startsWith('uploads/progress/')) continue

    const filePath = app.makePath('public', cleanPath)

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch {
      // File sudah tidak ada atau tidak bisa dihapus — lanjut saja
    }
  }
}

// ============================================================
// HELPER: Load semua relasi project yang dibutuhkan frontend
// ============================================================
async function loadProjectRelations(project: Project) {
  await project.load('client')
  await project.load('tasks')
  await project.load('progressLogs')
  await project.load('projectMaterials', (query) => {
    query.preload('material')
  })
}

// ============================================================
// HELPER: Hitung total material project untuk metadata activity log
// ============================================================
function summarizeProjectMaterials(project: Project) {
  const materials = project.projectMaterials || []

  const totalQty = materials.reduce((total, item) => total + Number(item.quantity || 0), 0)
  const totalCost = materials.reduce((total, item) => total + Number(item.subtotal || 0), 0)

  return {
    totalQty,
    totalCost,
    totalItems: materials.length,
  }
}

// ============================================================
// HELPER: Bentuk response project agar cocok dengan frontend
//
// Frontend butuh:
// - client
// - tasks
// - progressFeed
// - materials / projectMaterials
// ============================================================
function projectResponse(project: Project) {
  const projectMaterials =
    project.projectMaterials?.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      materialId: item.materialId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,

      material: item.material
        ? {
            id: item.material.id,
            name: item.material.name,
            description: item.material.description,
            category: item.material.category,
            sku: item.material.sku,
            stock: item.material.stock,
            unit: item.material.unit,
            price: item.material.price,
            stockIn: item.material.stockIn,
            stockOut: item.material.stockOut,
          }
        : null,

      name: item.material?.name || '-',
      category: item.material?.category || '-',
      sku: item.material?.sku || '-',
      stock: item.material?.stock || 0,
      unit: item.material?.unit || 'pcs',

      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) || []

  return {
    id: project.id,
    clientId: project.clientId,
    client: project.client?.name || '-',
    name: project.name,
    status: project.status,
    progress: project.progress,
    cover: project.cover,
    location: project.location,
    deadline: formatDateValue(project.deadline),
    budget: project.budget,
    overview: project.overview,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,

    timeline: buildAutoTimeline(project),

    tasks:
      project.tasks?.map((task) => ({
        id: task.id,
        projectId: task.projectId,
        label: task.label,
        done: task.done,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.done ? task.updatedAt : null,
      })) || [],

    progressFeed:
      project.progressLogs?.map((log) => ({
        id: log.id,
        projectId: log.projectId,
        author: log.author,
        note: log.note,
        img: log.image,
        image: log.image,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        date:
          log.createdAt
            ?.setZone('Asia/Jakarta')
            .setLocale('id')
            .toFormat("dd LLL yyyy, HH:mm 'WIB'") || '',
      })) || [],

    projectMaterials,
    materials: projectMaterials,
  }
}

export default class ProjectsController {
  // ============================================================
  // GET /api/projects
  // ============================================================
  async index({ request, response }: HttpContext) {
    const monthInput = request.input('month')
    const yearInput = request.input('year')

    const month = monthInput ? Number(monthInput) : null
    const year = yearInput ? Number(yearInput) : null

    const query = Project.query()
      .preload('client')
      .preload('tasks')
      .preload('progressLogs')
      .preload('projectMaterials', (q) => {
        q.preload('material')
      })
      .orderBy('created_at', 'desc')

    // Filter berdasarkan tahun dari created_at
    if (year && Number.isInteger(year)) {
      query.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
    }

    // Filter berdasarkan bulan dari created_at (1-12)
    if (month && Number.isInteger(month) && month >= 1 && month <= 12) {
      query.whereRaw('EXTRACT(MONTH FROM created_at) = ?', [month])
    }

    const projects = await query

    return response.ok({
      message: 'Data project berhasil diambil.',
      data: projects.map((project) => projectResponse(project)),
    })
  }

  // ============================================================
  // POST /api/projects
  // Tambah project baru
  // ============================================================
  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const userId = getCurrentUserId(ctx)
    const body = request.all()

    const clientId = Number(body.client_id || body.clientId || 0)
    const client = await Client.find(clientId)

    if (!client) {
      return response.badRequest({
        message: 'Client tidak ditemukan.',
      })
    }

    try {
      const progress = Math.max(0, Math.min(100, Number(body.progress || 0)))

      const project = await Project.create({
        clientId,
        name: body.name,
        status: body.status || (progress >= 100 ? 'done' : 'progress'),
        progress,
        cover: body.cover || null,
        location: body.location || null,
        deadline: body.deadline ? DateTime.fromISO(body.deadline) : null,
        budget: Number(body.budget || 0),
        overview: body.overview || null,
      })

      if (Array.isArray(body.materials)) {
        await syncProjectMaterials(project.id, body.materials)
      }

      await loadProjectRelations(project)

      const materialSummary = summarizeProjectMaterials(project)

      await createActivityLog({
        userId,
        module: 'project',
        action: 'created',
        title: 'Project baru dibuat',
        description: `Project ${project.name} untuk client ${project.client?.name || client.name} berhasil dibuat.`,
        icon: 'doc',
        color: 'green',
        metadata: {
          projectId: project.id,
          projectName: project.name,
          clientId: project.clientId,
          clientName: project.client?.name || client.name,
          budget: project.budget,
          materialTotalQty: materialSummary.totalQty,
          materialTotalCost: materialSummary.totalCost,
          materialTotalItems: materialSummary.totalItems,
        },
      })

      if (materialSummary.totalItems > 0) {
        await createActivityLog({
          userId,
          module: 'material',
          action: 'used_for_project',
          title: 'Material project digunakan',
          description: `${materialSummary.totalItems} material digunakan untuk project ${project.name}.`,
          icon: 'ticket',
          color: 'blue',
          metadata: {
            projectId: project.id,
            projectName: project.name,
            materialTotalQty: materialSummary.totalQty,
            materialTotalCost: materialSummary.totalCost,
            materialTotalItems: materialSummary.totalItems,
          },
        })
      }

      return response.created({
        message: 'Project berhasil ditambahkan.',
        data: projectResponse(project),
      })
    } catch (error) {
      return response.badRequest({
        message: getErrorMessage(error, 'Gagal menambahkan project.'),
      })
    }
  }

  // ============================================================
  // PUT /api/projects/:id
  // Update project
  // ============================================================
  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const project = await Project.find(params.id)

    if (!project) {
      return response.notFound({
        message: 'Project tidak ditemukan.',
      })
    }

    const oldProject = {
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
    }

    const body = request.all()
    const nextClientId = body.client_id || body.clientId

    if (nextClientId) {
      const client = await Client.find(Number(nextClientId))

      if (!client) {
        return response.badRequest({
          message: 'Client tidak ditemukan.',
        })
      }

      project.clientId = Number(nextClientId)
    }

    try {
      const progress =
        body.progress !== undefined
          ? Math.max(0, Math.min(100, Number(body.progress || 0)))
          : project.progress

      project.name = body.name ?? project.name
      project.status = body.status ?? (progress >= 100 ? 'done' : 'progress')
      project.progress = progress
      project.cover = body.cover ?? project.cover
      project.location = body.location ?? project.location

      if (body.deadline !== undefined) {
        project.deadline = body.deadline ? DateTime.fromISO(body.deadline) : null
      }

      project.budget = body.budget !== undefined ? Number(body.budget || 0) : project.budget
      project.overview = body.overview ?? project.overview

      await project.save()

      if (Array.isArray(body.materials)) {
        await syncProjectMaterials(project.id, body.materials)
      }

      await loadProjectRelations(project)

      const materialSummary = summarizeProjectMaterials(project)

      await createActivityLog({
        userId,
        module: 'project',
        action: 'updated',
        title: 'Project diperbarui',
        description: `Project ${project.name} berhasil diperbarui.`,
        icon: 'doc',
        color: 'cyan',
        metadata: {
          projectId: project.id,
          oldName: oldProject.name,
          newName: project.name,
          oldStatus: oldProject.status,
          newStatus: project.status,
          oldProgress: oldProject.progress,
          newProgress: project.progress,
          oldBudget: oldProject.budget,
          newBudget: project.budget,
          materialTotalQty: materialSummary.totalQty,
          materialTotalCost: materialSummary.totalCost,
          materialTotalItems: materialSummary.totalItems,
        },
      })

      if (Array.isArray(body.materials)) {
        await createActivityLog({
          userId,
          module: 'material',
          action: 'synced_for_project',
          title: 'Material project diperbarui',
          description: `Material untuk project ${project.name} berhasil diperbarui.`,
          icon: 'ticket',
          color: 'blue',
          metadata: {
            projectId: project.id,
            projectName: project.name,
            materialTotalQty: materialSummary.totalQty,
            materialTotalCost: materialSummary.totalCost,
            materialTotalItems: materialSummary.totalItems,
          },
        })
      }

      return response.ok({
        message: 'Project berhasil diperbarui.',
        data: projectResponse(project),
      })
    } catch (error) {
      return response.badRequest({
        message: getErrorMessage(error, 'Gagal memperbarui project.'),
      })
    }
  }

  // ============================================================
  // DELETE /api/projects/:id
  // Hapus project
  // ============================================================
  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const userId = getCurrentUserId(ctx)

    const project = await Project.find(params.id)

    if (!project) {
      return response.notFound({
        message: 'Project tidak ditemukan.',
      })
    }

    await loadProjectRelations(project)

    const deletedProject = {
      id: project.id,
      name: project.name,
      clientId: project.clientId,
      clientName: project.client?.name || '-',
      budget: project.budget,
    }

    const materialSummary = summarizeProjectMaterials(project)

    try {
      await restoreProjectMaterialsStock(project.id)

      // Hapus semua file foto progress logs dari disk sebelum row dihapus
      deleteProgressLogImages(project)

      await project.delete()

      await createActivityLog({
        userId,
        module: 'project',
        action: 'deleted',
        title: 'Project dihapus',
        description: `Project ${deletedProject.name} berhasil dihapus dari sistem.`,
        icon: 'doc',
        color: 'red',
        metadata: {
          projectId: deletedProject.id,
          projectName: deletedProject.name,
          clientId: deletedProject.clientId,
          clientName: deletedProject.clientName,
          budget: deletedProject.budget,
          materialTotalQty: materialSummary.totalQty,
          materialTotalCost: materialSummary.totalCost,
          materialTotalItems: materialSummary.totalItems,
        },
      })

      if (materialSummary.totalItems > 0) {
        await createActivityLog({
          userId,
          module: 'material',
          action: 'restored_from_project',
          title: 'Stok material dikembalikan',
          description: `Stok material dari project ${deletedProject.name} berhasil dikembalikan.`,
          icon: 'ticket',
          color: 'yellow',
          metadata: {
            projectId: deletedProject.id,
            projectName: deletedProject.name,
            materialTotalQty: materialSummary.totalQty,
            materialTotalCost: materialSummary.totalCost,
            materialTotalItems: materialSummary.totalItems,
          },
        })
      }

      return response.ok({
        message: 'Project berhasil dihapus.',
      })
    } catch (error) {
      return response.badRequest({
        message: getErrorMessage(error, 'Gagal menghapus project.'),
      })
    }
  }

  // ============================================================
  // GET /api/projects/options
  // Dipakai untuk dropdown project di halaman Files / Reports.
  // ============================================================
  async options({ response }: HttpContext) {
    try {
      const projects = await db.from('projects').select('id', 'name').orderBy('name', 'asc')

      return response.ok({
        projects,
      })
    } catch {
      return response.ok({
        projects: [],
      })
    }
  }
}
