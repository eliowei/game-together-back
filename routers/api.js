import { Router } from 'express'
import upload from '../middlewares/upload.js'

const router = Router()

router.post('/upload', upload, (req, res) => {
  res.json({
    success: true,
    message: '上傳成功',
    file: req.file,
  })
})

export default router
