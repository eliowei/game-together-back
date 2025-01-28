import Chat from '../model/chat.js'
import { StatusCodes } from 'http-status-codes'
import Group from '../model/group.js'
import validator from 'validator'

// 建立聊天室
export const create = async (req, res) => {
  try {
    // 取得body欄位資料
    const { group_id, text } = req.body

    // 驗證輸入
    if (!group_id || !text?.trim()) throw new Error('invalidInput')

    // 檢查揪團存在
    const group = await Group.findById(group_id).orFail(new Error('groupNotFound'))

    // 檢查揪團聊天室存在
    const groupChat = await Chat.findOne({ group_id })
    console.log(groupChat)
    if (groupChat) {
      throw new Error('chatAlreadyExists')
    }

    // 檢查使用者是否為揪團成員
    if (group.groupMembers.some((member) => member.user_id.toString() !== req.user._id.toString()))
      throw new Error('userNotInGroup')

    // 建立聊天室
    const result = await Chat.create({
      group_id,
    })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    if (error.message === 'invalidInput') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'invalidInput',
      })
    } else if (error.message === 'groupNotFound') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'groupNotFound',
      })
    } else if (error.message === 'userNotInGroup') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'userNotInGroup',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

// 透過揪團ID取得聊天室並得到訊息
export const getId = async (req, res) => {
  try {
    // 驗證ID是否為MongoID
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)

    // 確保頁碼最小是1。page大小如果小於1，則設定為1
    const validPage = Math.max(1, page)
    // 確保每頁筆數最小值為1，最大值為50，超過50則設定為50
    const validLimt = Math.min(50, Math.max(1, limit))
    // 跳過筆數，計算公式為 (頁碼 - 1) * 每頁筆數
    const skip = (validPage - 1) * validLimt

    // 檢查劉天室是否存在
    const chat = await Chat.findOne({ group_id: req.params.id })
      // 連結User資料，只取name欄位
      .populate({
        path: 'messages.user_id',
        select: 'name -_id',
      })
      // 選擇指定欄位
      .select({
        group_id: req.params.id,
        messages: { $slice: [skip, validLimt] },
      })
      // 拋出錯誤
      .orFail(new Error('NOT FOUND'))
    console.log(chat)
    // 找到揪團
    const group = await Group.findById(chat.group_id).orFail(new Error('groupNotFound'))

    // 檢查使用者是否為揪團成員
    const isMember = group.groupMembers.some(
      (member) => member.user_id.toString() === req.user._id.toString(),
    )

    if (!isMember) throw new Error('userNotInGroup')

    const result = chat.messages.map((message) => ({
      name: message.user_id.name,
      text: message.text,
      create_at: message.created_at,
    }))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'notFound',
      })
    } else if (error.message === 'userNotInGroup') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'userNotInGroup',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

// 新增聊天室訊息
export const addMessage = async (req, res) => {
  try {
    // 取得body欄位資料
    const { text } = req.body

    // 驗證ID是否為MongoID
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 驗證輸入是否有空白
    if (!text?.trim()) throw new Error('invalidInput')

    // 檢查聊天室是否存在
    const chat = await Chat.findOne({ group_id: req.params.id }).orFail(new Error('NOT FOUND'))

    // 找到揪團
    const group = await Group.findById(chat.group_id).orFail(new Error('groupNotFound'))

    // 檢查使用者是否為揪團成員
    const isMember = group.groupMembers.some(
      (member) => member.user_id.toString() === req.user._id.toString(),
    )

    // 如果不是揪團成員，拋出錯誤
    if (!isMember) throw new Error('userNotInGroup')

    // 新增訊息
    await Chat.updateOne(
      { group_id: req.params.id },
      {
        $push: {
          messages: {
            user_id: req.user._id,
            text: text.trim(),
            create_at: new Date(),
          },
        },
      },
    )
    await chat.save()
    // const result = await Chat.findOneAndUpdate(
    //   {
    //     group_id: req.params.id,
    //   },
    //   {
    //     $push: {
    //       messages: {
    //         user_id: req.user._id,
    //         text: text.trim(),
    //         create_at: new Date(),
    //       },
    //     },
    //   },
    //   { new: true },
    // )
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'notFound',
      })
    } else if (error.message === 'userNotInGroup') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'userNotInGroup',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

// 刪除聊天室
export const deleteChat = async (req, res) => {
  try {
    // 驗證ID是否為MongoID
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    if (!Chat.findOne({ group_id: req.params.id })) throw new Error('NOT FOUND')

    // 找到揪團聊天室，並刪除揪團聊天室
    await Chat.deleteOne({ group_id: req.params.id }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'notFound',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}
