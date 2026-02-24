import { StatusCodes } from 'http-status-codes'
import ContactForm from '../model/contactform.js'
import validator from 'validator'
import { MessagingError } from '../utils/errorHandler.js'

export const createForm = async (req, res) => {
  try {
    const { nickname, email, title, description } = req.body
    if (!nickname || !email || !title || !description) {
      throw new Error('invalidInput')
    }
    const newContactForm = new ContactForm({
      nickname,
      email,
      title,
      description,
    })
    const result = await newContactForm.save()
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

export const getAllForm = async (req, res) => {
  try {
    const result = await ContactForm.find()
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

export const getForm = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const { id } = req.params
    const result = await ContactForm.findById(id)
    if (!result) throw new Error('formNotFound')
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

export const deleteForm = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const { id } = req.params
    const result = await ContactForm.findByIdAndDelete(id)
    if (!result) throw new Error('formNotFound')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    MessagingError(error, res)
  }
}
