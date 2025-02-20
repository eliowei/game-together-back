import { Router } from 'express'
import * as user from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js'

const router = Router()
// 註冊
router.post('/', upload, user.create)
// 登入
router.post('/login', auth.login, user.login)
// 取得使用者資料
router.get('/profile', auth.jwt, upload, user.profile)
// 編輯使用者資料
router.patch('/profile', auth.jwt, upload, user.editProfile)
// 編輯指定使用者資料
router.patch('/profile/:id', auth.jwt, auth.admin, upload, user.edit)
// 更新使用者資料(TOKEN舊換新)
router.patch('/refresh', auth.jwt, user.refresh)
// 登出
router.delete('/logout', auth.jwt, user.logout)
// 取得所有使用者
router.get('/all', auth.jwt, auth.admin, user.getAll)
// 刪除
router.delete('/:id', auth.jwt, auth.admin, user.remove)

// 建立揪團
router.post('/organizerGroup', auth.jwt, user.createOrganizerGroup)
// 以Token，查詢主辦揪團
router.get('/organizerGroup', auth.jwt, user.getOrganizerGroup)
// 編輯主辦揪團
router.patch('/organizerGroup/:id', auth.jwt, upload, user.editOrganizerGroup)
// 刪除主辦揪團
router.delete('/organizerGroup/:id', auth.jwt, user.deleteOrganizerGroup)
// 踢除揪團成員
router.patch('/organizerGroup/:id/kick', auth.jwt, user.kickOrganizerGroup)

// 以Token，查詢已參加的揪團
router.get('/joinGroup', auth.jwt, user.getJoinGroup)
// 參加揪團
router.post('/joinGroup/:id', auth.jwt, user.updateJoinGroup)
// 離開揪團
router.delete('/joinGroup/:id', auth.jwt, user.deleteJoinGroup)

// 以Token，查詢已收藏的揪團
router.get('/favoriteGroup', auth.jwt, user.getFavoriteGroup)
// 收藏跟取消收藏揪團
router.post('/favoriteGroup/:id', auth.jwt, user.addFavoriteGroup)
router.delete('/favoriteGroup/:id', auth.jwt, user.deleteFavoriteGroup)
export default router
