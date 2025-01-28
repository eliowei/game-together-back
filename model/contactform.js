import { Schema, model } from 'mongoose'
import validator from 'validator'

const ContactForm = new Schema(
  {
    nickname: { type: String, required: [true, 'formNickNameRequired'] },
    email: {
      type: String,
      required: [true, 'formEmailRequired'],
      validator: {
        validator(value) {
          return validator.isEmail(value)
        },
      },
      message: 'formEmailInvalid',
    },
    title: { type: String, required: [true, 'formTitleRequired'] },
    description: { type: String, required: [true, 'formDescriptionRequired'] },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('contactforms', ContactForm)
