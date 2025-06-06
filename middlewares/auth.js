import passport from 'passport'
import { StatusCodes } from 'http-status-codes'
import jsonwebtoken from 'jsonwebtoken'
import UserRole from '../enums/user.js'

// 登入驗證
export const login = (req, res, next) => {
  // 使用 passport 的 login 驗證方式
  // session: false 停用 cookie
  // (error, user, info) 對應 done() 的三個東西
  passport.authenticate('login', { sesstion: false }, (error, user, info) => {
    console.log(error, user, info)
    // 如果沒有收到資料或發生錯誤
    if (!user || error) {
      // local 驗證策略的錯誤，缺少指定欄位的資料
      if (info.message === 'Missing credentials') {
        info.message = 'requestFormatError'
      }
      // 對不同的訊息使用不同的狀態碼回應
      if (info.message === 'serverError') {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          sucess: false,
          message: info.message,
        })
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: info.message,
        })
      }
    }
    // 將查詢到的登入使用者放入 req 中給後續的 controller 或 middleware 使用
    req.user = user
    // 繼續下一步
    next()
  })(req, res, next)
}

// jwt 驗證
export const jwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (error || !data) {
      // 是不是 JWT 錯誤，可能是過期、格式不對、secret 驗證失敗
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'userTokenInvalid',
        })
        // 伺服器錯誤，可能是打錯字或出bug
      } else if (info.message === 'serverError') {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: info.message,
        })
        // 其他錯誤，可能是找不到使用者、使用者沒有這個jwt
      } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          sucess: false,
          message: info.message,
        })
      }
    }

    req.user = data.user
    req.token = data.token
    // 下一步
    next()
  })(req, res, next)
}

// 管理員權限檢查
export const admin = (req, res, next) => {
  if (req.user.role !== UserRole.ADMIN) {
    res.status(StatusCodes.FORBIDDEN).json({
      sucess: false,
      message: 'userPermissionDenied',
    })
  } else {
    next()
  }
}
