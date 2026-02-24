import { StatusCodes } from 'http-status-codes'

export const MessagingError = (error, res) => {
  console.log(error.name || error.message)
  if (error.name == 'MongoServerError' && error.code === 11000) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: 'userAccountDuplicate',
    })
  } else if (error.name === 'CastError' || error.message === 'ID') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'idInvalid',
    })
  } else if (error.message === 'invalidInput') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'invalidInput',
    })
  } else if (error.message === 'groupNotFound') {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'groupNotFound',
    })
  } else if (error.message === 'formNotFound') {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'formNotFound',
    })
  } else if (error.message === 'NOT FOUND') {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'notFound',
    })
  } else if (error.name === 'ALREADY FAVORITE') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'alreadyFavorite',
    })
  } else if (error.message === 'ALREADY ORGANIZER') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'alreadyOrganized',
    })
  } else if (error.name === 'ALREADY JOINED') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'alreadyJoined',
    })
  } else if (error.message === 'SAME PASSWORD') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'samePassword',
    })
  } else if (error.message === 'NOT ORGANIZER') {
    res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'notOrganizer',
    })
  } else if (error.message === 'NOT MEMBER') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'notMember',
    })
  } else if (error.message === 'NOT FOUND REPLY') {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'notFoundReply',
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
  } else if (error.message === 'userNotInGroup') {
    res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'userNotInGroup',
    })
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}
