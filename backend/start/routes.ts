/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const FileController = () => import('../app/controllers/FileController.js')

// Login routes (public)
router.post('/register', '#controllers/authController.register')
router.post('/login', '#controllers/authController.login')
router.post('/google-login', '#controllers/authController.googleLogin')

// Endpoint untuk simpan data setelah upload Cloudinary
router.post('/api/files', [FileController, 'saveFileMetadata'])

// Endpoint untuk ambil riwayat project
router.get('/api/files/project/:projectId', [FileController, 'getFilesByProject'])

//CRUD admin
router
  .group(() => {
    router.get('/users', '#controllers/usersController.index')
    router.post('/users', '#controllers/usersController.store')
    router.delete('/users/:id', '#controllers/usersController.destroy')
  })
  .use(middleware.auth())
  .use(middleware.admin())

router.put('/users/:id', '#controllers/usersController.update').use(middleware.auth())
router.get('/users/:id', '#controllers/usersController.show').use(middleware.auth())

router
  .group(() => {
    router.post('/users/:id/certificates', '#controllers/usersController.addCertificate')
    router.put('/users/:id/certificates/:certId', '#controllers/usersController.updateCertificate')
    router.delete(
      '/users/:id/certificates/:certId',
      '#controllers/usersController.deleteCertificate'
    )
  })
  .use(middleware.auth())

router
  .get('/admin/stats', '#controllers/usersController.getAdminStats')
  .use(middleware.auth())
  .use(middleware.admin())

router
  .group(() => {
    router.post('/graphql', '#controllers/graphqlController.handle')
  })
  .use(middleware.optionalAuth())

router.get('/weather', '#controllers/weatherController.getByCity')
router.get('/weather/bencana/:id', '#controllers/weatherController.getByBencana')
