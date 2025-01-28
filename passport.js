import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import User from './model/user.js'
import bcrypt from 'bcrypt'

// 引用passportLocal 驗證策略
// 簡寫login 驗證方式
// new 策略(設定, 完成後執行的function)
passport.use(
  'login',
  new passportLocal.Strategy(
    {
      // 指定讀取的 rqe.body 的帳號欄位，預設是username，改為account
      usernameField: 'email',
      // 指定讀取的 rqe.body 的密碼欄位，預設是password
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // 查詢有沒有符合EMAIL的使用者
        const user = await User.findOne({ email: email }).orFail(new Error('EMAIL'))
        // 檢查密碼
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error('PASSWORD')
        }
        // 完成驗證方式，將資料帶入下一步處理
        // done(處理, 資料, info)
        return done(null, user, null)
      } catch (error) {
        console.log(error)
        if (error.message === 'EMAIL') {
          return done(null, null, { message: 'userNotFound' })
        } else if (error.message === 'PASSWORD') {
          return done(null, null, { message: 'userPasswordInvalid' })
        } else {
          return done(null, null, { message: 'serverError' })
        }
      }
    },
  ),
)

// 引用passsportJWT 驗證策略
// 編寫jwt 驗證方式
passport.use(
  'jwt',
  new passportJWT.Strategy(
    {
      // jwt 的位置
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      // secret
      secretOrKey: process.env.JWT_SECRET,
      // 讓後面的 function 能使用 req
      passReqToCallback: true,
      // 允許過期的 jwt 通過
      ignoreExpiration: true,
    },
    async (req, payload, done) => {
      try {
        // 因為沒有提供原始的 jwt ，所以利用套件語法取得
        // const token = req.headers.authorization.split(' ')[1]
        const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
        // 手動檢查過期
        // 只有refresh 和 logout 允許過期的jwt
        // payload.exp = jwt 過期，單位是秒
        // new Date().getTIme() = 目前時間，單位是毫秒
        const expired = payload.exp * 1000 < new Date().getTime()
        // 請求路徑
        // http://localhost:4000/user/test?aaa=111&bbb=222
        // req.originalUrl = /user/test ? aaa = 111 & bbb=222
        // req.baseUrl = /user
        // req.path = /test
        // req.query = { aaa: '111', bbb: '222'}
        const url = req.baseUrl + req.path
        if (expired && url !== '/user/refresh' && url !== '/user/logout') {
          throw new Error('EXPIRED')
        }

        //用解碼的資料去查詢有沒有使用者
        const user = await User.findById(payload._id).orFail(new Error('USER'))
        if (!user.tokens.includes(token)) {
          throw new Error('TOKEN')
        }
        // 都沒問題，下一步
        return done(null, { user, token }, null)
      } catch (error) {
        console.log(error)
        if (error.message === 'USER') {
          return done(null, null, { message: 'userNotFound' })
        } else if (error.message === 'EXPIRED') {
          return done(null, null, { message: 'userTokenExpired' })
        } else if (error.message === 'TOKEN') {
          return done(null, null, { message: 'userTokenInvalid' })
        } else {
          return done(null, null, { message: 'serverError' })
        }
      }
    },
  ),
)
