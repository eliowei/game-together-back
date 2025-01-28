import { StatusCodes } from 'http-status-codes'
import User from '../model/user.js'
import jwt from 'jsonwebtoken'
import Group from '../model/group.js'
import validator from 'validator'
import Chat from '../model/chat.js'

// 註冊
export const create = async (req, res) => {
  try {
    await User.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    if (error.name == 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'userAccountDuplicate',
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

// 登入
export const login = async (req, res) => {
  try {
    //jwt.sign(儲存資料, SECRET, 過期時間)
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        token,
        email: req.user.email,
        account: req.user.account,
        role: req.user.role,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

// 取得使用者資料
export const profile = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: '',
    result: {
      email: req.user.email,
      account: req.user.account,
      role: req.user.role,
    },
  })
}

// 編輯使用者資料
export const edit = async (req, res) => {
  try {
    req.body.image = req.file?.path

    const result = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        tags: req.body.tags,
      },
      {
        runValidators: true,
        new: true,
      },
    )

    res.status(StatusCodes.OK).json({
      success: true,
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

// 更新使用者資料(TOKEN舊換新)
export const refresh = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token)
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens[idx] = token
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token,
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

// 登出
export const logout = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token)
    req.user.tokens.splice(idx, 1)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

// 取得所有使用者
export const getAll = async (req, res) => {
  try {
    const result = await User.find()
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

// 使用者登入後得到的TOKEN，查詢主辦的揪團
export const getOrganizerGroup = async (req, res) => {
  try {
    // 使用 User model 查詢
    const result = await User.findById(req.user._id).populate({
      path: 'organize_groups.group_id',
      model: 'groups',
    })

    if (!result) {
      throw new Error('NOT FOUND')
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.organize_groups || [],
    })
  } catch (error) {
    console.log(error)
    if (error.message === 'NOT FOUND') {
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

// 編輯主辦揪團
export const editOrganizerGroup = async (req, res) => {
  try {
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    const group = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 確認是否為主辦者
    if (group.organizer_id.toString() !== req.user._id.toString()) {
      throw new Error('NOT ORGANIZER')
    }

    req.body.image = req.file?.path

    const result = await Group.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    }).orFail(new Error('NOT FOUND'))

    console.log(result)

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
    } else if (error.message === 'NOT ORGANIZER') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'notOrganizer',
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

// 刪除主辦揪團
export const deleteOrganizerGroup = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 1.找到要刪除的揪團
    const result = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 確認是否為主辦者
    if (result.organizer_id.toString() !== req.user._id.toString()) throw new Error('NOT ORGANIZER')

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

// 使用者登入後得到的TOKEN，查詢參加的揪團
export const getJoinGroup = async (req, res) => {
  try {
    // 使用 User model 查詢
    const result = await User.findById(req.user._id).populate({
      path: 'join_groups.group_id',
      model: 'groups',
    })

    if (!result) {
      throw new Error('NOT FOUND')
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.join_groups || [],
    })
  } catch (error) {
    console.log(error)
    if (error.message === 'NOT FOUND') {
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

// 使用者參加揪團
export const updateJoinGroup = async (req, res) => {
  try {
    const { group_id } = req.body
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    const group = await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否為主辦者
    if (group.organizer_id.toString() === req.user._id.toString()) {
      throw new Error('IS ORGANIZER')
    }

    // 4. 檢查是否已加入
    const isJoined = req.user.join_groups.some((g) => g.group_id?.toString() === group_id)
    if (isJoined) {
      throw new Error('ALREADY JOINED')
    }

    // 5. 檢查人數限制
    if (group.member_count >= group.member_limit) {
      throw new Error('GROUP FULL')
    }

    // 增加成員數
    group.member_count++

    // 更新群組成員資訊
    group.groupMembers.push({
      user_id: req.user._id,
      join_date: new Date(),
    })
    await group.save()

    // 更新使用者加入群組記錄
    req.user.join_groups.push({ group_id: group._id })
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.join_groups,
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'notFound',
      })
    } else if (error.message === 'IS ORGANIZER') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'alreadyOrganized',
      })
    } else if (error.name === 'ALREADY JOINED') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'alreadyJoined',
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else if (error.name === 'GROUP FULL') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'groupFull',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

// 使用者離開揪團
export const deleteJoinGroup = async (req, res) => {
  try {
    const { group_id } = req.body
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) {
      throw new Error('ID')
    }

    // 2. 檢查群組是否存在
    const group = await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否為主辦者
    if (group.organizer_id.toString() === req.user._id.toString()) {
      throw new Error('IS ORGANIZER')
    }

    // 4. 檢查是否已加入
    const isJoined = req.user.join_groups.some((g) => g.group_id?.toString() === group_id)
    if (!isJoined) {
      throw new Error('NOT JOINED')
    }

    // 減少成員數
    group.member_count--

    // 更新群組成員資訊
    const idx = group.groupMembers.findIndex(
      (member) => member.user_id.toString() === req.user._id.toString(),
    )
    group.groupMembers.splice(idx, 1)
    await group.save()

    // 更新使用者離開群組記錄
    const idx2 = req.user.join_groups.findIndex((g) => g.group_id?.toString() === group_id)
    req.user.join_groups.splice(idx2, 1)
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.join_groups,
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'notFound',
      })
    } else if (error.message === 'IS ORGANIZER') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'alreadyOrganized',
      })
    } else if (error.name === 'ALREADY JOINED') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'alreadyJoined',
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else if (error.name === 'GROUP FULL') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'groupFull',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

// 使用者登入後得到的TOKEN，查詢收藏的揪團
export const getFavoriteGroup = async (req, res) => {
  try {
    const result = await User.findById(req.user._id).populate({
      path: 'favorite_groups.group_id',
      model: 'groups',
    })

    if (!result) {
      throw new Error('NOT FOUND')
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.favorite_groups || [],
    })
  } catch (error) {
    console.log(error)
    if (error.message === 'NOT FOUND') {
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

// 收藏跟取消揪團
export const updateFavoriteGroup = async (req, res) => {
  try {
    const { group_id } = req.body

    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否已收藏
    const isFavorite = req.user.favorite_groups.some(
      (group) => group.group_id?.toString() === group_id,
    )

    // 4. 更新收藏揪團狀態，如果有收藏則找到該筆揪團資料刪除，否則就新增進去
    if (isFavorite) {
      const idx = req.user.favorite_groups.findIndex((g) => g.group_id?.toString() === group_id)
      req.user.favorite_groups.splice(idx, 1)
    } else {
      req.user.favorite_groups.push({ group_id })
    }
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.favorite_groups,
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.BAD_REQUEST).json({
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
