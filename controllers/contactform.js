import { StatusCodes } from 'http-status-codes'
import ContactForm from '../model/contactform.js'
import validator from 'validator'

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
    if (error.message === 'invalidInput') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'invalidInput',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
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
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'formNotFound') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'formNotFound',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
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
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'idInvalid',
      })
    } else if (error.message === 'formNotFound') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'formNotFound',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}
