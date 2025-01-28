import { Schema, model, ObjectId } from 'mongoose'

const Chat = new Schema(
  {
    group_id: { type: ObjectId, ref: 'groups' },
    messages: [
      {
        user_id: { type: ObjectId, ref: 'users' },
        text: { type: String, required: [true, 'chatMessageRequired'] },
        created_at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
export default model('chats', Chat)
