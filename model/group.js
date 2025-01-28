import { Schema, model, ObjectId } from 'mongoose'

const GroupMember = new Schema({
  user_id: { type: ObjectId, ref: 'users' },
  join_date: { type: Date, default: Date.now },
})

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
    region: {
      type: String,
      required: [true, 'regionRequired'],
      default: '無',
    },
    address: {
      type: String,
      required: [true, 'addressRequired'],
      default: '無',
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('groups', Group)
