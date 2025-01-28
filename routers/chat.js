import { Router } from 'express'
import * as Chat from '../controllers/chat.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

// 建立聊天室
router.post('/', auth.jwt, Chat.create)

// 新增聊天訊息
router.post('/:id/message', auth.jwt, Chat.addMessage)

// 取得聊天室並得到訊息
router.get('/:id', auth.jwt, Chat.getId)

// 刪除聊天室
router.delete('/:id', auth.jwt, Chat.deleteChat)

export default router
