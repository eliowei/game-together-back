import Group from '../model/group.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'
import User from '../model/user.js'
import Chat from '../model/chat.js'

export const create = async (req, res) => {
  try {
    // 設定主辦者ID
    req.body.organizer_id = req.user._id
    req.body.image = req.file?.path || ''

    // 主辦者加到 groupMembers
    req.body.groupMembers = [
      {
        user_id: req.user._id,
        join_date: new Date(),
      },
    ]

    // 建立揪團
    const result = await Group.create(req.body)
    console.log('建立揪團 ID', result._id)

    // 包裝成 { group_id: result._id } 格式，
    const groupEntry = {
      group_id: result._id,
    }

    // 更新使用者的主辦揪團紀錄，使用 group._id
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { organize_groups: groupEntry },
      },
      { new: true },
    )
    // 確認 ID 是否正確寫入
    // console.log('新建揪團 ID:', result._id)
    console.log('新建揪團', result)
    console.log('更新後的使用者資料:', updatedUser)

    // 建立聊天室
    await Chat.create({
      group_id: result._id,
    })

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    const result = await Group.find().populate('organizer_id', 'name').lean()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    const result = await Group.findById(req.params.id)
      .populate('organizer_id', 'name')
      .lean()
      .populate('groupMembers.user_id', 'name')
      .lean()
      .orFail(new Error('NOT FOUND'))
    res.status(StatusCodes.OK).json({
      sucess: true,
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
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    req.body.image = req.file?.path

    const result = await Group.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    }).orFail(new Error('NOT FOUND'))

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
    }
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

export const remove = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 1.找到要刪除的揪團
    const result = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 2. 從參加成員的 join_groups 移除此揪團
    await User.updateMany(
      { 'join_groups.group_id': result._id },
      { $pull: { join_groups: { group_id: result._id } } },
    )

    // 3. 從主辦揪團的 organize_groups 移除此揪團
    const updatedOrganizer = await User.findByIdAndUpdate(
      result.organizer_id,
      {
        $pull: { organize_groups: { group_id: result._id } },
      },
      { new: true },
    )
    console.log('更新後的主辦者資料', updatedOrganizer)

    // 4.刪除揪團
    await Group.findByIdAndDelete(req.params.id)

    // 5.刪除聊天室
    await Chat.deleteOne({ group_id: req.params.id })

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)

    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        sucess: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'notFound',
      })
    } else if (error.message === 'NOT ORGANIZER') {
      res.status(StatusCodes.FORBIDDEN).json({
        sucess: false,
        message: 'notOrganizer',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}
