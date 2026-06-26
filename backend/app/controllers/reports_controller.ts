import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createActivityLog } from '#services/activity_log_service'

function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === 'all') {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function parseNumberValue(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDateValue(value: unknown) {
  if (!value) return '-'

  const date = value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(String(value))

  if (!date.isValid) return String(value)

  return date.toFormat('dd LLL yyyy')
}

function formatDateTimeValue(value: unknown) {
  if (!value) return '-'

  const date = value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(String(value))

  if (!date.isValid) return String(value)

  return date.toFormat('dd LLL yyyy HH:mm')
}

function safeFileName(value: string) {
  return (
    String(value || 'laporan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'laporan'
  )
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '""'

  const text = String(value).replace(/\r?\n|\r/g, ' ')
  return `"${text.replace(/"/g, '""')}"`
}

function buildCsv(headers: string[], rows: unknown[][]) {
  const content = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')

  // BOM \uFEFF supaya Excel lebih aman membaca UTF-8.
  return `\uFEFF${content}`
}

function getReportTypeLabel(type: string) {
  if (type === 'stock') return 'Laporan Stok'
  if (type === 'keuangan') return 'Laporan Keuangan'
  return 'Laporan Project'
}

export default class ReportsController {
  private applyDateFilter(query: any, columnName: string, startDate?: string, endDate?: string) {
    if (startDate) {
      query.whereRaw(`DATE(${columnName}) >= ?`, [startDate])
    }

    if (endDate) {
      query.whereRaw(`DATE(${columnName}) <= ?`, [endDate])
    }
  }

  private async getUserNameRawSelect() {
    const availableColumns = await db
      .from('information_schema.columns')
      .where('table_name', 'users')
      .whereIn('column_name', ['full_name', 'name', 'username', 'email'])
      .select('column_name')

    const columnNames = availableColumns.map((item) => item.column_name)

    const orderedColumns = ['full_name', 'name', 'username', 'email'].filter((column) =>
      columnNames.includes(column)
    )

    if (!orderedColumns.length) {
      return db.raw(`'-' as user_name`)
    }

    const coalesceColumns = orderedColumns.map((column) => `NULLIF(users.${column}, '')`).join(', ')

    return db.raw(`COALESCE(${coalesceColumns}, '-') as user_name`)
  }

  private async getProjectName(projectId: number | null) {
    if (!projectId) return 'Semua Proyek'

    try {
      const project = await db.from('projects').where('id', projectId).select('id', 'name').first()
      return project?.name || `Project ${projectId}`
    } catch {
      return `Project ${projectId}`
    }
  }

  private async getProjectCount(projectId: number | null) {
    try {
      const query = db.from('projects').count('* as total')

      if (projectId) {
        query.where('id', projectId)
      }

      const row = await query.first()
      return parseNumberValue(row?.total)
    } catch {
      return 0
    }
  }

  private async getStockCount(projectId: number | null) {
    try {
      if (projectId) {
        const row = await db
          .from('project_materials')
          .where('project_id', projectId)
          .countDistinct('material_id as total')
          .first()

        return parseNumberValue(row?.total)
      }

      const row = await db.from('materials').count('* as total').first()
      return parseNumberValue(row?.total)
    } catch {
      return 0
    }
  }

  private async getKeuanganTotal(projectId: number | null) {
    try {
      const query = db.from('projects').sum('budget as total')

      if (projectId) {
        query.where('id', projectId)
      }

      const row = await query.first()
      return parseNumberValue(row?.total)
    } catch {
      return 0
    }
  }

  private async buildProjectCsv(projectId: number | null, startDate?: string, endDate?: string) {
    const query = db
      .from('projects')
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .select(
        'projects.id',
        'projects.name',
        'projects.status',
        'projects.progress',
        'projects.location',
        'projects.deadline',
        'projects.budget',
        'projects.created_at',
        'clients.name as client_name'
      )
      .orderBy('projects.id', 'asc')

    if (projectId) {
      query.where('projects.id', projectId)
    }

    this.applyDateFilter(query, 'projects.created_at', startDate, endDate)

    const projects = await query

    const headers = [
      'ID Project',
      'Nama Project',
      'Client',
      'Status',
      'Progress (%)',
      'Lokasi',
      'Deadline',
      'Budget',
      'Dibuat Pada',
    ]

    const rows = projects.map((project) => [
      project.id,
      project.name,
      project.client_name || '-',
      project.status || '-',
      parseNumberValue(project.progress),
      project.location || '-',
      formatDateValue(project.deadline),
      parseNumberValue(project.budget),
      formatDateTimeValue(project.created_at),
    ])

    return buildCsv(headers, rows)
  }

  private async buildStockCsv(projectId: number | null, startDate?: string, endDate?: string) {
    const query = db
      .from('materials')
      .select(
        'materials.id',
        'materials.name',
        'materials.description',
        'materials.category',
        'materials.sku',
        'materials.stock',
        'materials.unit',
        'materials.price',
        'materials.stock_in',
        'materials.stock_out',
        'materials.created_at',
        'materials.updated_at'
      )
      .orderBy('materials.id', 'asc')

    if (projectId) {
      query
        .join('project_materials', 'materials.id', 'project_materials.material_id')
        .where('project_materials.project_id', projectId)
    }

    this.applyDateFilter(query, 'materials.updated_at', startDate, endDate)

    const materials = await query

    const headers = [
      'ID Material',
      'SKU',
      'Nama Material',
      'Deskripsi',
      'Kategori',
      'Stok Saat Ini',
      'Satuan',
      'Harga Satuan',
      'Barang Masuk',
      'Barang Keluar',
      'Nilai Stok',
      'Update Terakhir',
    ]

    const rows = materials.map((material) => {
      const stock = parseNumberValue(material.stock)
      const price = parseNumberValue(material.price)

      return [
        material.id,
        material.sku || '-',
        material.name || '-',
        material.description || '-',
        material.category || '-',
        stock,
        material.unit || '-',
        price,
        parseNumberValue(material.stock_in),
        parseNumberValue(material.stock_out),
        stock * price,
        formatDateTimeValue(material.updated_at || material.created_at),
      ]
    })

    return buildCsv(headers, rows)
  }

  private async buildKeuanganCsv(projectId: number | null, startDate?: string, endDate?: string) {
    const query = db
      .from('projects')
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .leftJoin('project_materials', 'projects.id', 'project_materials.project_id')
      .select(
        'projects.id',
        'projects.name',
        'projects.status',
        'projects.budget',
        'projects.created_at',
        'clients.name as client_name'
      )
      .sum('project_materials.subtotal as material_total')
      .groupBy(
        'projects.id',
        'projects.name',
        'projects.status',
        'projects.budget',
        'projects.created_at',
        'clients.name'
      )
      .orderBy('projects.id', 'asc')

    if (projectId) {
      query.where('projects.id', projectId)
    }

    this.applyDateFilter(query, 'projects.created_at', startDate, endDate)

    const projects = await query

    const headers = [
      'ID Project',
      'Nama Project',
      'Client',
      'Status',
      'Budget Project',
      'Total Material',
      'Sisa Budget',
      'Persentase Material dari Budget (%)',
      'Dibuat Pada',
    ]

    const rows = projects.map((project) => {
      const budget = parseNumberValue(project.budget)
      const materialTotal = parseNumberValue(project.material_total)
      const remainingBudget = budget - materialTotal
      const materialPercentage =
        budget > 0 ? Number(((materialTotal / budget) * 100).toFixed(2)) : 0

      return [
        project.id,
        project.name,
        project.client_name || '-',
        project.status || '-',
        budget,
        materialTotal,
        remainingBudget,
        materialPercentage,
        formatDateTimeValue(project.created_at),
      ]
    })

    return buildCsv(headers, rows)
  }

  async summary({ request, response }: HttpContext) {
    try {
      const projectId = parseNullableInt(request.input('projectId'))
      const projectCount = await this.getProjectCount(projectId)
      const stockCount = await this.getStockCount(projectId)
      const keuanganTotal = await this.getKeuanganTotal(projectId)

      return response.ok({
        summary: {
          projectCount,
          stockCount,
          keuanganTotal,
        },
      })
    } catch (error) {
      return response.badRequest({
        message: 'Gagal mengambil ringkasan laporan.',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async logs({ request, response }: HttpContext) {
    try {
      const projectId = parseNullableInt(request.input('projectId'))
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const userNameSelect = await this.getUserNameRawSelect()

      const query = db
        .from('report_logs')
        .leftJoin('users', 'report_logs.generated_by', 'users.id')
        .select(
          'report_logs.id',
          'report_logs.report_type',
          'report_logs.report_name',
          'report_logs.generated_at',
          'report_logs.generated_by',
          'users.avatar as user_photo',
          userNameSelect
        )
        .orderBy('report_logs.generated_at', 'desc')
        .limit(10)

      if (projectId) {
        query.where('report_logs.project_id', projectId)
      }

      this.applyDateFilter(query, 'report_logs.generated_at', startDate, endDate)

      const logs = await query

      return response.ok({
        logs: logs.map((log) => ({
          id: log.id,
          userName: log.user_name || '-',
          userPhoto: log.user_photo || '',
          generatedBy: log.generated_by || null,
          reportName: log.report_name,
          reportType: log.report_type,
          createdAt: log.generated_at,
        })),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Gagal mengambil log laporan.',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async export(ctx: HttpContext) {
    const { request, response } = ctx

    try {
      const type = String(request.input('type') || 'project')
      const projectId = parseNullableInt(request.input('projectId'))
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      const authManager = (ctx as any).auth

      let authUser = authManager?.user || null

      if (!authUser && authManager?.authenticate) {
        authUser = await authManager.authenticate()
      }

      const generatedByFromAuth = authUser?.id ? Number(authUser.id) : null
      const generatedByFromRequest = parseNullableInt(request.input('generatedBy'))
      const generatedBy = generatedByFromAuth || generatedByFromRequest

      const projectName = await this.getProjectName(projectId)

      let csvContent = ''
      let reportTitle = ''

      if (type === 'stock') {
        csvContent = await this.buildStockCsv(projectId, startDate, endDate)
        reportTitle = `Laporan Stok - ${projectName}`
      } else if (type === 'finance') {
        csvContent = await this.buildKeuanganCsv(projectId, startDate, endDate)
        reportTitle = `Laporan Keuangan - ${projectName}`
      } else {
        csvContent = await this.buildProjectCsv(projectId, startDate, endDate)
        reportTitle = `Laporan Proyek - ${projectName}`
      }

      // Nama file untuk header Content-Disposition — tidak disimpan ke disk
      const timestamp = DateTime.now().setZone('Asia/Jakarta').toFormat('yyyyLLdd_HHmmss')
      const safeType = safeFileName(type)
      const fileName = `laporan_${safeType}_${timestamp}.csv`

      // Catat ke report_logs (hanya metadata, bukan path file fisik)
      await db.table('report_logs').insert({
        project_id: projectId,
        generated_by: generatedBy,
        report_type: type,
        report_name: reportTitle,
        filter_start_date: startDate || null,
        filter_end_date: endDate || null,
        generated_file_path: null,
        generated_at: DateTime.now().toSQL(),
        created_at: DateTime.now().toSQL(),
        updated_at: DateTime.now().toSQL(),
      })

      await createActivityLog({
        userId: generatedBy || null,
        module: 'report',
        action: 'exported',
        title: 'Laporan CSV diunduh',
        description: `${getReportTypeLabel(type)} untuk ${projectName} berhasil diunduh.`,
        icon: 'doc',
        color: 'purple',
        metadata: {
          reportType: type,
          reportName: reportTitle,
          projectId,
          projectName,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      })

      // Stream langsung ke browser — tidak ada file yang tersimpan di server
      response.header('Content-Type', 'text/csv; charset=utf-8')
      response.header('Content-Disposition', `attachment; filename="${fileName}"`)

      return response.send(csvContent)
    } catch (error) {
      return response.badRequest({
        message: 'Gagal membuat laporan CSV.',
        error: error instanceof Error ? error.message : error,
      })
    }
  }
}
