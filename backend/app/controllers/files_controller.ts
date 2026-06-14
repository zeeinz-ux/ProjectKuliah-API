import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { createReadStream } from 'node:fs'
import { copyFile, mkdir, unlink } from 'node:fs/promises'

import File from '#models/File'
import { createActivityLog } from '#services/activity_log_service'

function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === 'all') {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function getCurrentUserId(ctx: HttpContext) {
  const user = (ctx as any).auth?.user
  return user?.id ? Number(user.id) : null
}

function getFileActionTitle(category: string) {
  const lowerCategory = String(category || '').toLowerCase()

  if (
    lowerCategory.includes('foto') ||
    lowerCategory.includes('gambar') ||
    lowerCategory.includes('dokumentasi') ||
    lowerCategory.includes('progress')
  ) {
    return 'Dokumentasi diunggah'
  }

  return 'File diunggah'
}

function getFileActionDescription(fileName: string, projectName: string, category: string) {
  const lowerCategory = String(category || '').toLowerCase()

  if (
    lowerCategory.includes('foto') ||
    lowerCategory.includes('gambar') ||
    lowerCategory.includes('dokumentasi') ||
    lowerCategory.includes('progress')
  ) {
    return `Dokumentasi ${fileName} berhasil diunggah untuk project ${projectName}.`
  }

  return `File ${fileName} berhasil diunggah untuk project ${projectName}.`
}

export default class FilesController {
  private async getProjectNameMap(projectIds: number[]) {
    const map = new Map<number, string>()

    if (!projectIds.length) {
      return map
    }

    try {
      const projects = await db.from('projects').whereIn('id', projectIds).select('id', 'name')

      projects.forEach((project) => {
        map.set(Number(project.id), project.name)
      })
    } catch {
      // fallback aman kalau tabel projects belum siap
    }

    return map
  }

  private async getProjectName(projectId: number | null) {
    if (!projectId) return '-'

    try {
      const project = await db.from('projects').where('id', projectId).select('name').first()
      return project?.name || '-'
    } catch {
      return '-'
    }
  }

  private serializeFile(file: File, projectName: string = '-') {
    return {
      id: file.id,
      fileName: file.originalName,
      storedName: file.storedName,
      filePath: `/api/files/${file.id}/open`,
      downloadUrl: `/api/files/${file.id}/download`,
      fileSize: Number(file.fileSize || 0),
      fileType: file.mimeType,
      category: file.category,
      uploadedAt: file.uploadedAt?.toISO() || file.createdAt?.toISO() || null,
      projectName,
    }
  }

  async index({ request, response }: HttpContext) {
    try {
      const projectId = parseNullableInt(request.input('projectId'))
      const page = Math.max(1, Number(request.input('page', 1)) || 1)
      const limit = Math.min(100, Math.max(1, Number(request.input('limit', 25)) || 25))
      const monthInput = request.input('month')
      const yearInput = request.input('year')

      const month = monthInput ? Number(monthInput) : null
      const year = yearInput ? Number(yearInput) : null

      const query = File.query().orderBy('uploaded_at', 'desc')

      if (projectId) {
        query.where('project_id', projectId)
      }

      // Filter berdasarkan uploaded_at; fallback ke created_at kalau null
      if (year && Number.isInteger(year)) {
        query.whereRaw('EXTRACT(YEAR FROM COALESCE(uploaded_at, created_at)) = ?', [year])
      }

      if (month && Number.isInteger(month) && month >= 1 && month <= 12) {
        query.whereRaw('EXTRACT(MONTH FROM COALESCE(uploaded_at, created_at)) = ?', [month])
      }

      const files = await query.paginate(page, limit)

      const projectIds = files
        .all()
        .map((file) => file.projectId)
        .filter((id): id is number => Number.isInteger(id))

      const projectNameMap = await this.getProjectNameMap(projectIds)

      return response.ok({
        files: files
          .all()
          .map((file) =>
            this.serializeFile(
              file,
              file.projectId ? projectNameMap.get(file.projectId) || '-' : '-'
            )
          ),

        pagination: {
          currentPage: files.currentPage,
          totalPages: files.lastPage,
          totalItems: files.total,
          perPage: files.perPage,
        },
      })
    } catch (error) {
      return response.badRequest({
        message: 'Gagal mengambil data file.',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async upload(ctx: HttpContext) {
    const { request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const uploadedFile = request.file('file', {
      size: '5mb',
      extnames: ['pdf', 'xlsx'],
    })

    if (!uploadedFile) {
      return response.badRequest({
        message: 'Field file tidak terbaca. Pastikan key upload bernama "file".',
      })
    }

    if (uploadedFile.hasErrors) {
      return response.badRequest({
        message:
          uploadedFile.errors?.[0]?.message || 'File tidak valid. Hanya PDF dan XLSX maksimal 5MB.',
        errors: uploadedFile.errors,
      })
    }

    if (!uploadedFile.tmpPath) {
      return response.badRequest({
        message: 'tmpPath file tidak ditemukan.',
      })
    }

    try {
      const projectId = parseNullableInt(request.input('projectId'))
      const uploadedBy = userId || parseNullableInt(request.input('uploadedBy'))
      const category = request.input('category') || 'Dokumen Lain'

      const originalName = uploadedFile.clientName
      const extname = uploadedFile.extname || 'bin'
      const storedName = `${string.uuid()}.${extname}`
      const detectedMimeType =
        extname === 'pdf'
          ? 'application/pdf'
          : extname === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : uploadedFile.type || 'application/octet-stream'
      const storageDir = app.makePath('storage/uploads/files')
      const absolutePath = app.makePath(`storage/uploads/files/${storedName}`)

      await mkdir(storageDir, { recursive: true })
      await copyFile(uploadedFile.tmpPath, absolutePath)
      await unlink(uploadedFile.tmpPath)

      const record = await File.create({
        projectId,
        uploadedBy,
        originalName,
        storedName,
        filePath: absolutePath,
        mimeType: detectedMimeType,
        fileSize: uploadedFile.size,
        category,
        uploadedAt: DateTime.now(),
      })

      const projectName = await this.getProjectName(projectId)

      await createActivityLog({
        userId: uploadedBy || null,
        module: 'file',
        action: 'uploaded',
        title: getFileActionTitle(category),
        description: getFileActionDescription(originalName, projectName, category),
        icon: 'doc',
        color: 'blue',
        metadata: {
          fileId: record.id,
          fileName: record.originalName,
          storedName: record.storedName,
          filePath: `/api/files/${record.id}/open`,
          downloadUrl: `/api/files/${record.id}/download`,
          fileType: record.mimeType,
          fileSize: record.fileSize,
          category: record.category,
          projectId: record.projectId,
          projectName,
          uploadedBy,
        },
      })

      return response.created({
        message: 'File berhasil diupload ke server dan metadata tersimpan.',
        file: this.serializeFile(record, projectName),
      })
    } catch (error) {
      return response.badRequest({
        message: error instanceof Error ? error.message : 'Gagal upload file.',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async open({ params, response }: HttpContext) {
    const file = await File.find(params.id)

    if (!file) {
      return response.notFound({
        message: 'File tidak ditemukan.',
      })
    }

    const ext = file.originalName.split('.').pop()?.toLowerCase()

    let mimeType = file.mimeType

    if (!mimeType || mimeType === 'application' || mimeType === 'application/octet-stream') {
      if (ext === 'pdf') {
        mimeType = 'application/pdf'
      } else if (ext === 'xlsx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      } else {
        mimeType = 'application/octet-stream'
      }
    }

    response.header('Content-Type', mimeType)

    response.header('Content-Disposition', `inline; filename="${safeFileName(file.originalName)}"`)

    response.header('X-Content-Type-Options', 'nosniff')

    return response.stream(createReadStream(file.filePath))
  }

  async download(ctx: HttpContext) {
    const { params, response } = ctx
    const userId = getCurrentUserId(ctx)

    const file = await File.find(params.id)

    if (!file) {
      return response.notFound({
        message: 'File tidak ditemukan.',
      })
    }

    const projectName = await this.getProjectName(file.projectId)

    await createActivityLog({
      userId,
      module: 'file',
      action: 'downloaded',
      title: 'File diunduh',
      description: `File ${file.originalName} berhasil diunduh.`,
      icon: 'doc',
      color: 'cyan',
      metadata: {
        fileId: file.id,
        fileName: file.originalName,
        storedName: file.storedName,
        fileType: file.mimeType,
        fileSize: file.fileSize,
        category: file.category,
        projectId: file.projectId,
        projectName,
      },
    })

    return response.attachment(file.filePath, safeFileName(file.originalName))
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const userId = getCurrentUserId(ctx)

    const file = await File.find(params.id)

    if (!file) {
      return response.notFound({
        message: 'File tidak ditemukan.',
      })
    }

    const deletedFile = {
      id: file.id,
      originalName: file.originalName,
      storedName: file.storedName,
      filePath: file.filePath,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      category: file.category,
      projectId: file.projectId,
    }

    const projectName = await this.getProjectName(file.projectId)

    try {
      try {
        await unlink(file.filePath)
      } catch {
        // aman kalau file fisik sudah tidak ada
      }

      await file.delete()

      await createActivityLog({
        userId,
        module: 'file',
        action: 'deleted',
        title: 'File dihapus',
        description: `File ${deletedFile.originalName} berhasil dihapus.`,
        icon: 'doc',
        color: 'red',
        metadata: {
          fileId: deletedFile.id,
          fileName: deletedFile.originalName,
          storedName: deletedFile.storedName,
          fileType: deletedFile.mimeType,
          fileSize: deletedFile.fileSize,
          category: deletedFile.category,
          projectId: deletedFile.projectId,
          projectName,
        },
      })

      return response.ok({
        message: 'File berhasil dihapus.',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Gagal menghapus file.',
        error: error instanceof Error ? error.message : error,
      })
    }
  }
}
