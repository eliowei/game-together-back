import { Router } from 'express'
import * as group from '../controllers/group.js'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js'

const router = Router()
// 建立主辦揪團
router.post('/', auth.jwt, upload, group.create)
// 取得所有揪團
router.get('/all', auth.jwt, group.getAll)
// 取得所有揪團
router.get('/', group.getAll)

router.post('/search', group.getAll)
// 取得指定的揪團
router.get('/:id', group.getId)
// 新增揪團留言
router.post('/:id/comment', auth.jwt, group.addComment)
// 刪除揪團留言
router.delete('/:id/comment', auth.jwt, group.removeComment)
// 回覆揪團留言
router.patch('/:id/replayComment', auth.jwt, group.replyComment)
// 刪除回覆揪團留言
router.delete('/:id/replayComment', auth.jwt, group.removeReplyComment)

// 編輯揪團
router.patch('/:id', auth.jwt, auth.admin, upload, group.edit)
// 刪除揪團
router.delete('/:id', auth.jwt, auth.admin, group.remove)

export default router
