import { StatusCodes } from 'http-status-codes'
import User from '../model/user.js'
import jwt from 'jsonwebtoken'
import Group from '../model/group.js'
import validator from 'validator'
import Chat from '../model/chat.js'
import bcrypt from 'bcrypt'
import { MessagingError } from '../utils/errorHandler.js'

// 註冊
export const create = async (req, res) => {
  try {
    req.body.image = req.file?.path || ''
    await User.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
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
        id: req.user._id,
        email: req.user.email,
        account: req.user.account,
        name: req.user.name,
        age: req.user.age,
        gender: req.user.gender,
        role: req.user.role,
        tags: req.user.tags,
        image: req.user.image,
        favorite_groups: req.user.favorite_groups,
      },
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}

// 取得使用者資料
export const profile = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: '',
    result: {
      id: req.user._id,
      email: req.user.email,
      account: req.user.account,
      name: req.user.name,
      age: req.user.age,
      gender: req.user.gender,
      role: req.user.role,
      tags: req.user.tags,
      image: req.user.image,
      favorite_groups: req.user.favorite_groups,
    },
  })
}
// 編輯使用者資料
export const editProfile = async (req, res) => {
  try {
    req.body.image = req.file?.path

    const result = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        image: req.body.image,
        tags: req.body.tags,
      },
      {
        runValidators: true,
        new: true,
      },
    ).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}

// 編輯指定使用者資料
export const edit = async (req, res) => {
  try {
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const user = await User.findById(req.params.id).orFail(new Error('NOT FOUND'))

    if (req.file) {
      user.image = req.file?.path
    }
    if (req.body.email) user.email = req.body.email
    if (req.body.name) user.name = req.body.name
    if (req.body.account) user.account = req.body.account
    if (req.body.password) {
      const isSamePassword = await bcrypt.compare(req.body.password, user.password)
      if (isSamePassword) throw new Error('SAME PASSWORD')
      user.password = req.body.password
    }
    if (req.body.gender) user.gender = req.body.gender
    if (req.body.age) user.age = req.body.age
    await user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: user,
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
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
    MessagingError(error, res)
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
    MessagingError(error, res)
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
    MessagingError(error, res)
  }
}

// 刪除會員
export const remove = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 1.找到要刪除的使用者
    const user = await User.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 2. 找出該使用者主辦的所有揪團
    const organizeGroups = await Group.find({ organizer_id: user._id })

    // 3. 更新所有參加者的相關資料
    for (const group of organizeGroups) {
      // 更新參加者的 join_groups
      await User.updateMany(
        {
          _id: { $in: group.members },
        },
        {
          $pull: { join_groups: group._id },
        },
      )
      // 刪除揪團相關聊天室
      await Chat.deleteMany({ group_id: group._id })
    }

    // 4. 刪除該使用者主辦的所有揪團
    await Group.deleteMany({ organizer_id: user._id })

    // 5.找出使用者參加的揪團
    const joinedGroups = await Group.find({ 'groupMembers.user_id': user._id })

    // 6.更新參加揪團資料並刪除相關聊天室
    for (const group of joinedGroups) {
      // 更新成員名單和人數
      await Group.findByIdAndUpdate(group._id, {
        $pull: { groupMembers: { user_id: user._id } },
        $inc: { member_count: -1 },
      })
    }

    // 7.刪除使用者
    await User.findByIdAndDelete(req.params.id)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '刪除成功',
      result: user,
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}

export const createOrganizerGroup = async (req, res) => {
  try {
    const organizerId = req.body.organizer_id || req.user._id

    // 驗證 organizer_id 是否為有效的 MongoDB ID
    if (!validator.isMongoId(organizerId)) {
      throw new Error('無效的主辦者ID')
    }

    // 主辦者加到 groupMembers
    req.body.groupMembers = [
      {
        user_id: organizerId,
        join_date: new Date(),
      },
    ]

    // 建立揪團
    const result = await Group.create({ ...req.body, organizer_id: organizerId })
    // console.log('建立揪團 ID', result._id)

    // 包裝成 { group_id: result._id } 格式，
    const groupEntry = {
      group_id: result._id,
    }

    // 更新使用者的主辦揪團紀錄，使用 group._id
    await User.findByIdAndUpdate(
      organizerId,
      {
        $push: { organize_groups: groupEntry },
      },
      { new: true },
    )
    // 確認 ID 是否正確寫入
    // console.log('新建揪團 ID:', result._id)
    // console.log('新建揪團', result)
    // console.log('更新後的使用者資料:', updatedUser)

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
    MessagingError(error, res)
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
    MessagingError(error, res)
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
    MessagingError(error, res)
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
    await User.findByIdAndUpdate(
      result.organizer_id,
      {
        $pull: { organize_groups: { group_id: result._id } },
      },
      { new: true },
    )
    // console.log('更新後的主辦者資料', updatedOrganizer)

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
    MessagingError(error, res)
  }
}
// 主辦者踢除揪團成員
export const kickOrganizerGroup = async (req, res) => {
  try {
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    const group = await Group.findById(req.params.id).orFail(new Error('NOT FOUND'))

    // 確認是否為主辦者
    if (group.organizer_id.toString() !== req.user._id.toString()) {
      throw new Error('NOT ORGANIZER')
    }

    // 3. 檢查被踢除者是否為揪團成員
    const member = group.groupMembers.find(
      (member) => member.user_id.toString() === req.body.user_id,
    )
    if (!member) throw new Error('NOT MEMBER')

    const result = await Group.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { groupMembers: { user_id: req.body.user_id } },
        $inc: { member_count: -1 },
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate('groupMembers.user_id', ['name', 'image'])

    await User.findByIdAndUpdate(req.body.user_id, {
      $pull: { join_groups: { group_id: req.params.id } },
    })

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}

// 使用者登入後得到的TOKEN，查詢參加的揪團
export const getJoinGroup = async (req, res) => {
  try {
    // 使用 User model 查詢
    const result = await User.findById(req.user._id).populate({
      path: 'join_groups.group_id',
      populate: {
        path: 'groupMembers.user_id',
        select: 'image',
      },
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
    MessagingError(error, res)
  }
}

// 使用者參加揪團
export const updateJoinGroup = async (req, res) => {
  try {
    const group_id = req.params.id
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    const group = await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否為主辦者
    if (group.organizer_id.toString() === req.user._id.toString()) {
      throw new Error('ALREADY ORGANIZER')
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
    MessagingError(error, res)
  }
}

// 使用者離開揪團
export const deleteJoinGroup = async (req, res) => {
  try {
    const group_id = req.params.id
    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) {
      throw new Error('ID')
    }

    // 2. 檢查群組是否存在
    const group = await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否為主辦者
    if (group.organizer_id.toString() === req.user._id.toString()) {
      throw new Error('ALREADY ORGANIZER')
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
    MessagingError(error, res)
  }
}

// 使用者登入後得到的TOKEN，查詢收藏的揪團
export const getFavoriteGroup = async (req, res) => {
  try {
    const result = await User.findById(req.user._id).populate({
      path: 'favorite_groups.group_id',
      populate: {
        path: 'groupMembers.user_id',
        select: 'image',
      },
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
    MessagingError(error, res)
  }
}

// 收藏揪團
export const addFavoriteGroup = async (req, res) => {
  try {
    const group_id = req.params.id

    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否已收藏
    const isFavorite = req.user.favorite_groups.some((group) => {
      return group.group_id.toString() === group_id
    })

    if (isFavorite) throw new Error('ALREADY FAVORITE')

    req.user.favorite_groups.push({ group_id: group_id })
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.favorite_groups,
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}

export const deleteFavoriteGroup = async (req, res) => {
  try {
    const group_id = req.params.id

    // 1. 檢查 ID 格式
    if (!validator.isMongoId(group_id)) throw new Error('ID')

    // 2. 檢查揪團是否存在
    await Group.findById(group_id).orFail(new Error('NOT FOUND'))

    // 3. 檢查是否已收藏
    const isFavorite = req.user.favorite_groups.some((group) => {
      return group.group_id.toString() === group_id
    })

    if (!isFavorite) throw new Error('NOT FAVORITE')

    const idx = req.user.favorite_groups.findIndex(
      (group) => group.group_id.toString() === group_id.toString(),
    )

    req.user.favorite_groups.splice(idx, 1)
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.favorite_groups,
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}
