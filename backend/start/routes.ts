/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// AUTH
router.post('/register', '#controllers/authController.register')
router.post('/login', '#controllers/authController.login')
router.post('/google-login', '#controllers/authController.googleLogin')

// USERS - VIEW FOR LOGGED IN USERS
router.get('/users', '#controllers/usersController.index').use(middleware.auth())
router.get('/me', '#controllers/usersController.me').use(middleware.auth())
router.put('/me', '#controllers/usersController.updateMe').use(middleware.auth())
router.put('/me/password', '#controllers/usersController.changePassword').use(middleware.auth())

// USERS - CRUD ONLY SUPER ADMIN
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
