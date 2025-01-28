import { Router } from 'express'
import * as ContactForm from '../controllers/contactform.js'

const router = Router()

// 建立聯絡我們表單
router.post('/', ContactForm.createForm)
// 取得聯絡我們表單
router.get('/all', ContactForm.getAllForm)
// 取得指定聯絡我們表單
router.get('/:id', ContactForm.getForm)
// 刪除聯絡我們表單
router.delete('/:id', ContactForm.deleteForm)

export default router
