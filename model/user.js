import { Schema, model, ObjectId, Error } from 'mongoose'
import UserRole from '../enums/user.js'
import bcrypt from 'bcrypt'
import validator from 'validator'

const organizeGroupSchema = new Schema({
  group_id: {
    type: ObjectId,
    ref: 'groups', // 關聯到 groups collection
  },
})

const favoriteGroupSchema = new Schema({
  group_id: {
    type: ObjectId,
    ref: 'groups',
  },
})

const joinGroupSchema = new Schema({
  group_id: {
    type: ObjectId,
    ref: 'groups',
  },
})

const schema = new Schema(
  {
    account: {
      type: String,
      required: [true, 'userAccountRequired'],
      minlength: [4, 'userAccountTooShort'],
      maxlength: [20, 'userAccountTooLong'],
      unique: true,
      validator: {
        validator(value) {
          return validator.isAlphanumeric(value)
        },
        message: 'userAccountInvalid',
      },
    },
    email: {
      type: String,
      required: [true, 'userEmailRequired'],
      validator: {
        validator(value) {
          return validator.isEmail(value)
        },
        message: 'userEmailInvalid',
      },
    },
    password: {
      type: String,
      required: [true, 'userPasswordRequired'],
    },
    name: {
      type: String,
      required: [true, 'userNameRequired'],
    },
    gender: {
      type: String,
      enum: {
        values: ['男', '女'],
        message: 'userGenderInvalid',
      },
      default: '男',
    },
    age: {
      type: Number,
      default: 0,
    },
    role: {
      type: Number,
      default: UserRole.NUMBER,
    },
    tags: {
      type: [String],
      default: ['電腦'],
    },
    organize_groups: {
      type: [organizeGroupSchema],
    },
    favorite_groups: {
      type: [favoriteGroupSchema],
    },
    join_groups: {
      type: [joinGroupSchema],
    },
    image: {
      type: String,
      default:
        'https://res.cloudinary.com/dad40cwb0/image/upload/v1737510536/yelvemq2sv9iruxjbdyb.png',
    },
    tokens: {
      type: [String],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

// mongoose 驗證後，存入資料庫前執行動作
schema.pre('save', function (next) {
  const user = this
  // 密碼欄位有修改再處理
  if (user.isModified('password')) {
    //自己寫驗證
    if (user.password.length < 4) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: 'userPasswordTooShort' }))
      next(error)
    } else if (user.password.length > 20) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: 'userPasswordTooLong' }))
      next(error)
    } else {
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

export default model('users', schema)
