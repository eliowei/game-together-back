import Group from '../model/group.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'
import User from '../model/user.js'
import Chat from '../model/chat.js'
import { getCityKey } from '../utils/cityMapping.js'

export const create = async (req, res) => {
  try {
    const organizerId = req.body.organizer_id || req.user._id

    // 驗證 organizer_id 是否為有效的 MongoDB ID
    if (!validator.isMongoId(organizerId)) {
      throw new Error('無效的主辦者ID')
    }
    req.body.image = req.file?.path || ''

    // 主辦者加到 groupMembers
    req.body.groupMembers = [
      {
        user_id: organizerId,
        join_date: new Date(),
      },
    ]

    // 建立揪團
    const result = await Group.create({ ...req.body, organizer_id: organizerId })
    console.log('建立揪團 ID', result._id)

    // 包裝成 { group_id: result._id } 格式，
    const groupEntry = {
      group_id: result._id,
    }

    // 更新使用者的主辦揪團紀錄，使用 group._id
    const updatedUser = await User.findByIdAndUpdate(
      organizerId,
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
    const searchParams = req.method === 'POST' ? req.body : req.query
    console.log('搜尋條件：', searchParams)
    const filter = {}

    if (searchParams.search) {
      const cityKey = getCityKey(searchParams.search)

      filter.$or = [
        { name: new RegExp(searchParams.search, 'i') },
        { description: new RegExp(searchParams.search, 'i') },
        { type: new RegExp(searchParams.search, 'i') },
        { city: new RegExp(cityKey, 'i') },
        { region: new RegExp(searchParams.search, 'i') },
        { tags: new RegExp(searchParams.search, 'i') },
      ]
    }
    // 類型
    else if (searchParams.type) {
      filter.type = new RegExp(searchParams.type, 'i')
    }

    // 地區搜尋
    else if (searchParams.region) {
      const regions = searchParams.region.split(',')

      filter.$or = regions.map((item) => {
        const [city, region] = item.match(/(.+?)[市縣](.+?[市區鎮鄉])?/).slice(1)
        const cityKeys = getCityKey(city)
        return {
          city: new RegExp(cityKeys || '', 'i'),
          region: new RegExp(region || '', 'i'),
        }
      })
    }
    // 標籤搜尋
    else if (searchParams.tags) {
      const searchTags = Array.isArray(searchParams.tags) ? searchParams.tags : [searchParams.tags]

      filter.$or = searchTags.map((tag) => ({
        tags: new RegExp(tag, 'i'),
      }))
    }
    // 日期搜尋
    else if (searchParams.time) {
      filter.time = new RegExp(searchParams.time, 'i')
      console.log('搜尋日期：', searchParams.time)
    }
    console.log('最終搜尋條件：', filter)

    const result = await Group.find(filter)
      .populate('organizer_id', ['name', 'image'])
      .lean()
      .populate('groupMembers.user_id', ['name', 'image'])
      .lean()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
    console.log(result)

    console.log('找到的結果數量：', result.length)
    console.log(
      '結果的標籤：',
      result.map((item) => item.tags),
    )
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
      .populate('organizer_id', ['name', 'image'])
      .lean()
      .populate('groupMembers.user_id', ['name', 'image'])
      .lean()
      .populate('comments.user_id', ['name', 'image'])
      .lean()
      .populate('comments.reply.author', ['name', 'image'])
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

export const addComment = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await Group.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user_id: req.user._id,
            content: req.body.content,
          },
        },
      },
      {
        new: true,
        select: 'comments',
        runValidators: true,
      },
    ).populate('comments.user_id', ['name', 'image'])

    if (!result) throw new Error('NOT FOUND')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.comments[result.comments.length - 1],
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
    } else if (error.name === 'ValidationError') {
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

export const replyComment = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 檢查揪團是否存在
    const group = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 檢查是否為主辦者
    if (group.organizer_id.toString() !== req.user._id.toString()) {
      throw new Error('NOT ORGANIZER')
    }
    const result = await Group.findOneAndUpdate(
      {
        _id: req.params.id,
        'comments._id': req.body.comment_id,
      },
      {
        $set: {
          'comments.$.reply': {
            author: req.user._id,
            message: req.body.message,
            date: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate('comments.reply.author', ['name', 'image'])

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: '',
      result: result.comments[result.comments.length - 1],
    })
  } catch (error) {
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
    } else if (error.name === 'ValidationError') {
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

export const removeReplyComment = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 檢查揪團是否存在
    const group = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    if (group.organizer_id.toString() !== req.user._id.toString()) throw new Error('NOT ORGANIZER')

    const hasReply = group.comments.find(
      (comment) => comment._id.toString() === req.body.comment_id,
    ).reply.message

    // 檢查是否已回覆
    if (!hasReply) throw new Error('NOT FOUND REPLY')

    const result = await Group.findOneAndUpdate(
      {
        _id: req.params.id,
        'comments._id': req.body.comment_id,
      },
      {
        $unset: {
          'comments.$.reply': '',
        },
      },
      {
        new: true,
      },
    ).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: '',
      result: result.comments[result.comments.length - 1],
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
    } else if (error.message === 'NOT ORGANIZER') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'notOrganizer',
      })
    } else if (error.message === 'NOT FOUND REPLY') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'notFoundReply',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

export const removeComment = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 檢查揪團是否存在
    const group = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 檢查是否為主辦者
    if (group.organizer_id.toString() !== req.user._id.toString()) throw new Error('NOT ORGANIZER')

    // const hasReply = group.comments.find(
    //   (comment) => comment._id.toString() === req.body.comment_id,
    // ).reply.message

    const result = await Group.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { comments: { _id: req.body.comment_id } },
      },
      {
        new: true,
      },
    ).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.comments,
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
    } else if (error.message === 'NOT ORGANIZER') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
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
    } else if (error.name === 'ValidationError') {
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
