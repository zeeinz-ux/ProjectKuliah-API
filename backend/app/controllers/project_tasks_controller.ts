import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import ProjectTask from '#models/project_task'
import { createActivityLog } from '#services/activity_log_service'

export default class ProjectTasksController {
  // =========================
  // POST /api/projects/:id/tasks
  // Tambah task baru ke project
  // =========================
  async store({ params, request, response }: HttpContext) {
    const project = await Project.find(params.id)

    if (!project) {
      return response.notFound({
        message: 'Project tidak ditemukan.',
      })
    }

    const label = request.input('label')

    if (!label || !String(label).trim()) {
      return response.badRequest({
        message: 'Nama task wajib diisi.',
      })
    }

    const task = await ProjectTask.create({
      projectId: project.id,
      label: String(label).trim(),
      done: false,
    })

    const user = (request as any).user

    await createActivityLog({
      userId: user?.id,
      module: 'project_task',
      action: 'created',
      title: `Task "${task.label}" ditambahkan`,
      description: `Task baru untuk proyek "${project.name}" telah ditambahkan.`,
      icon: 'doc',
      color: 'green',
      metadata: {
        taskId: task.id,
        taskLabel: task.label,
        projectId: project.id,
        projectName: project.name,
      },
    })

    return response.created({
      message: 'Task berhasil ditambahkan.',
      data: {
        id: task.id,
        projectId: task.projectId,
        label: task.label,
        done: task.done,
      },
    })
  }

  // =========================
  // PUT /api/projects/:projectId/tasks/:taskId
  // Update task: checklist / uncheck / ubah label
  // =========================
  async update({ params, request, response }: HttpContext) {
    const task = await ProjectTask.query()
      .where('id', params.taskId)
      .where('project_id', params.projectId)
      .first()

    if (!task) {
      return response.notFound({
        message: 'Task tidak ditemukan.',
      })
    }

    const label = request.input('label')
    const done = request.input('done')

    if (label !== undefined) {
      if (!String(label).trim()) {
        return response.badRequest({
          message: 'Nama task tidak boleh kosong.',
        })
      }

      task.label = String(label).trim()
    }

    if (done !== undefined) {
      task.done = Boolean(done)
    }

    await task.save()

    const user = (request as any).user
    const project = await Project.find(params.projectId)

    await createActivityLog({
      userId: user?.id,
      module: 'project_task',
      action: 'updated',
      title: `Task "${task.label}" diperbarui`,
      description: label !== undefined
        ? `Label task diubah menjadi "${task.label}".`
        : done !== undefined
          ? `Status task "${task.label}" diubah menjadi ${done ? 'selesai' : 'belum selesai'}.`
          : `Task "${task.label}" telah diperbarui.`,
      icon: 'doc',
      color: 'blue',
      metadata: {
        taskId: task.id,
        taskLabel: task.label,
        taskDone: task.done,
        projectId: task.projectId,
        projectName: project?.name,
      },
    })

    return response.ok({
      message: 'Task berhasil diperbarui.',
      data: {
        id: task.id,
        projectId: task.projectId,
        label: task.label,
        done: task.done,
      },
    })
  }

  // =========================
  // DELETE /api/projects/:projectId/tasks/:taskId
  // Hapus task dari project
  // =========================
  async destroy({ params, request, response }: HttpContext) {
    const task = await ProjectTask.query()
      .where('id', params.taskId)
      .where('project_id', params.projectId)
      .first()

    if (!task) {
      return response.notFound({
        message: 'Task tidak ditemukan.',
      })
    }

    const project = await Project.find(params.projectId)

    await task.delete()

    const user = (request as any).user

    await createActivityLog({
      userId: user?.id,
      module: 'project_task',
      action: 'deleted',
      title: `Task "${task.label}" dihapus`,
      description: `Task dari proyek "${project?.name || '#'}" telah dihapus.`,
      icon: 'doc',
      color: 'red',
      metadata: {
        taskId: task.id,
        taskLabel: task.label,
        projectId: params.projectId,
        projectName: project?.name,
      },
    })

    return response.ok({
      message: 'Task berhasil dihapus.',
    })
  }
}
