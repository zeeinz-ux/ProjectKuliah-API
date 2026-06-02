/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const PasswordResetsController = () => import('#controllers/password_resets_controller')

// =========================
// AUTH
// =========================
router.post('/register', '#controllers/authController.register')
router.post('/login', '#controllers/authController.login')

// =========================
// USERS - VIEW FOR LOGGED IN USERS
// =========================
router.get('/users', '#controllers/usersController.index').use(middleware.auth())
router.get('/me', '#controllers/usersController.me').use(middleware.auth())
router.put('/me', '#controllers/usersController.updateMe').use(middleware.auth())
router.put('/me/password', '#controllers/usersController.changePassword').use(middleware.auth())

// =========================
// USERS - CRUD ONLY ADMIN
// =========================
router
  .post('/users', '#controllers/usersController.store')
  .use(middleware.auth())
  .use(middleware.admin())

router
  .put('/users/:id', '#controllers/usersController.update')
  .use(middleware.auth())
  .use(middleware.admin())

router
  .delete('/users/:id', '#controllers/usersController.destroy')
  .use(middleware.auth())
  .use(middleware.admin())

// =========================
// PASSWORD RESET
// =========================
router.post('/forgot-password', [PasswordResetsController, 'forgotPassword'])
router.post('/reset-password', [PasswordResetsController, 'resetPassword'])

// =========================
// FILES - Open & Download TANPA AUTH
// Diakses langsung oleh browser (iframe / anchor download),
// tidak bisa dikirim lewat fetch dengan header Authorization
// karena akan diblokir ad blocker. Upload, delete, dan list
// tetap protected di dalam grup auth di bawah.
// =========================
router.get('/api/files/:id/open', '#controllers/files_controller.open')
router.get('/api/files/:id/download', '#controllers/files_controller.download')
// Endpoint:
// GET http://localhost:3333/api/holidays/2026
//
// Tidak pakai middleware auth,
// karena hanya mengambil tanggal merah publik.
// =========================
router
  .group(() => {
    router.get('/holidays/:year', '#controllers/calendar_controller.show')
  })
  .prefix('/api')

// =========================
// PROTECTED API ROUTES
// Semua route di bawah ini wajib login / pakai token
// =========================
router
  .group(() => {
    // =========================
    // ACTIVITY LOGS / NOTIFICATIONS
    // Endpoint untuk Page Notifikasi dan Recent Activity Dashboard
    // =========================
    router.get('/activity-logs', '#controllers/activity_logs_controller.index')
    router.get('/activity-logs/unread-count', '#controllers/activity_logs_controller.unreadCount')
    router.patch('/activity-logs/read-all', '#controllers/activity_logs_controller.markAllAsRead')
    router.patch('/activity-logs/:id/read', '#controllers/activity_logs_controller.markAsRead')
    router.delete('/activity-logs/:id', '#controllers/activity_logs_controller.destroy')

    // =========================
    // CLIENTS
    // =========================
    router.get('/clients', '#controllers/clients_controller.index')
    router.post('/clients', '#controllers/clients_controller.store')
    router.put('/clients/:id', '#controllers/clients_controller.update')
    router.delete('/clients/:id', '#controllers/clients_controller.destroy')

    // =========================
    // PROJECTS
    // =========================
    router.get('/projects', '#controllers/projects_controller.index')
    router.post('/projects', '#controllers/projects_controller.store')

    // Harus ditaruh sebelum /projects/:id
    // Supaya "options" tidak kebaca sebagai id project
    router.get('/projects/options', '#controllers/projects_controller.options')

    router.put('/projects/:id', '#controllers/projects_controller.update')
    router.delete('/projects/:id', '#controllers/projects_controller.destroy')

    // =========================
    // PROJECT TASKS
    // =========================
    router.post('/projects/:id/tasks', '#controllers/project_tasks_controller.store')
    router.put('/projects/:projectId/tasks/:taskId', '#controllers/project_tasks_controller.update')
    router.delete(
      '/projects/:projectId/tasks/:taskId',
      '#controllers/project_tasks_controller.destroy'
    )

    // =========================
    // PROJECT PROGRESS LOGS
    // =========================
    router.post(
      '/projects/:id/progress-logs',
      '#controllers/project_progress_logs_controller.store'
    )

    router.delete(
      '/projects/:projectId/progress-logs/:logId',
      '#controllers/project_progress_logs_controller.destroy'
    )

    // =========================
    // MATERIALS / STOK MATERIAL
    // =========================
    router.get('/materials', '#controllers/materials_controller.index')
    router.post('/materials', '#controllers/materials_controller.store')
    router.put('/materials/:id', '#controllers/materials_controller.update')
    router.delete('/materials/:id', '#controllers/materials_controller.destroy')

    router.patch('/materials/:id/stock-in', '#controllers/materials_controller.stockIn')
    router.patch('/materials/:id/stock-out', '#controllers/materials_controller.stockOut')

    // =========================
    // CALENDAR EVENTS CRUD
    // =========================
    router.get('/calendar-events', '#controllers/calendar_events_controller.index')
    router.post('/calendar-events', '#controllers/calendar_events_controller.store')
    router.put('/calendar-events/:id', '#controllers/calendar_events_controller.update')
    router.delete('/calendar-events/:id', '#controllers/calendar_events_controller.destroy')

    // =========================
    // FILES
    // Catatan: open & download sudah dipindah ke luar grup ini (tanpa auth)
    // supaya bisa diakses langsung oleh browser tanpa XHR/fetch
    // =========================
    router.get('/files', '#controllers/files_controller.index')
    router.post('/files/upload', '#controllers/files_controller.upload')
    router.delete('/files/:id', '#controllers/files_controller.destroy')

    // =========================
    // REPORTS
    // =========================
    router.get('/report-logs', '#controllers/reports_controller.logs')
    router.get('/reports/summary', '#controllers/reports_controller.summary')
    router.get('/reports/export', '#controllers/reports_controller.export')
  })
  .prefix('/api')
  .use(middleware.auth())
