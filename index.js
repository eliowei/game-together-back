import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import routerUser from './routers/user.js'
import routerGroup from './routers/group.js'
import routerChat from './routers/chat.js'
import routerContactForm from './routers/contactform.js'
import './passport.js'
import cors from 'cors'

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('資料庫連線成功')
  })
  .catch((error) => {
    console.log('資料庫連線失敗')
    console.log(error)
  })

const app = express()
app.use(
  cors({
    // origin = 請求來源網域
    // callback(錯誤, 是否允許)
    origin(origin, callback) {
      console.log('origin:' + origin)
      if (
        // postman 的 origin 預設是 undefined
        // origin === undefined ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('github.io')
      ) {
        callback(null, true)
      } else {
        callback(new Error('CORS'), false)
      }
    },
  }),
)

app.use(express.json())
app.use((error, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: 'requestFormatError',
  })
})

app.use('/user', routerUser)
app.use('/group', routerGroup)
app.use('/chat', routerChat)
app.use('/contactform', routerContactForm)

app.listen(process.env.PORT || 4000, () => {
  console.log('伺服器啟動成功')
})
