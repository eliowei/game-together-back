import { Schema, model, ObjectId } from 'mongoose'

const GroupMember = new Schema({
  user_id: { type: ObjectId, ref: 'users' },
  join_date: { type: Date, default: Date.now },
})

const Comment = new Schema(
  {
    user_id: { type: ObjectId, ref: 'users', required: [true, 'userIdRequired'] },
    content: {
      type: String,
      required: [true, 'commentRequired'],
      minlength: [1, 'commentMinLength'],
    },
    reply: {
      author: { type: ObjectId, ref: 'users' },
      message: String,
      date: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

const Group = new Schema(
  {
    organizer_id: {
      type: ObjectId,
      ref: 'users',
      required: [true, 'organizerIdRequired'],
    },
    name: {
      type: String,
      required: [true, 'nameRequired'],
      minlength: [1, 'nameMinLength'],
    },
    image: {
      type: String,
      required: [true, 'imageRequired'],
      default: '/default-group.png',
    },
    description: {
      type: String,
      required: [true, 'descriptionRequired'],
      minlength: [1, 'descriptionMinLength'],
    },
    content: {
      type: String,
      required: [true, 'contentRequired'],
      minlength: [1, 'contentMinLength'],
    },
    type: {
      type: String,
      required: [true, 'typeRequired'],
    },
    member_count: {
      type: Number,
      default: 1, // 預設為 1 (包含主辦者)
      min: [1, 'memberCountMin'],
    },
    member_limit: {
      type: Number,
      required: [true, 'memberLimitRequired'],
      min: [2, 'memberLimitMin'],
    },
    contact_method: {
      type: String,
      enum: {
        values: ['Line', 'Discord', 'Facebook'],
        message: 'contactMethodInvalid',
      },
      default: 'Line',
      required: [true, 'contactMethodRequired'],
    },
    contact_info: {
      type: String,
      required: [true, 'contactInfoRequired'],
      minlength: [1, 'contactInfominLength'],
    },
    city: {
      type: String,
      validator: {
        validator(value) {
          return this.type !== 'offline' || (value && value.length > 0)
        },
      },
      message: 'cityRequired',
      default: '無',
    },
    region: {
      type: String,
      validator: {
        validator(value) {
          return this.type !== 'offline' || (value && value.length > 0)
        },
        message: 'regionRequired',
        default: '無',
      },
    },
    address: {
      type: String,
      validator: {
        validator(value) {
          return this.type !== 'offline' || (value && value.length > 0)
        },
        message: 'addressRequired',
        default: '無',
      },
    },
    tags: {
      type: [String],
      required: [true, 'tagsRequired'],
      minItems: [1, 'tagsMinItems'],
    },
    time: {
      type: String,
      required: [true, 'timeRequired'],
    },
    groupMembers: [GroupMember],
    comments: [Comment],
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('groups', Group)
