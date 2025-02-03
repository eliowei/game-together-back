import { Router } from 'express'
import upload from '../middlewares/upload.js'
import * as auth from '../middlewares/auth.js'
import * as api from '../controllers/api.js'

const router = Router()

router.post('/upload', auth.jwt, upload, api.upload)

export default router
