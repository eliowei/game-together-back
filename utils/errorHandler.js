import { StatusCodes } from 'http-status-codes'

const errorMap = {
  // MongoDB 相關錯誤
  MongoServerError: {
    status: StatusCodes.CONFLICT,
    message: 'userAccountDuplicate',
    checkFn: (error) => error.code === 11000,
  },
  CastError: {
    status: StatusCodes.BAD_REQUEST,
    message: 'idInvalid',
  },
  ValidationError: {
    status: StatusCodes.BAD_REQUEST,
    message: null, // 需要從 error.errors 提取
    isValidation: true,
  },
  // 自訂錯誤 (message)
  ID: { status: StatusCodes.BAD_REQUEST, message: 'idInvalid' },
  invalidInput: { status: StatusCodes.BAD_REQUEST, message: 'invalidInput' },
  groupNotFound: { status: StatusCodes.NOT_FOUND, message: 'groupNotFound' },
  formNotFound: { status: StatusCodes.NOT_FOUND, message: 'formNotFound' },
  'NOT FOUND': { status: StatusCodes.NOT_FOUND, message: 'notFound' },
  'ALREADY ORGANIZER': { status: StatusCodes.BAD_REQUEST, message: 'alreadyOrganized' },
  'SAME PASSWORD': { status: StatusCodes.BAD_REQUEST, message: 'samePassword' },
  'NOT ORGANIZER': { status: StatusCodes.FORBIDDEN, message: 'notOrganizer' },
  'NOT MEMBER': { status: StatusCodes.BAD_REQUEST, message: 'notMember' },
  'NOT FOUND REPLY': { status: StatusCodes.NOT_FOUND, message: 'notFoundReply' },
  userNotInGroup: { status: StatusCodes.FORBIDDEN, message: 'userNotInGroup' },
  // 自訂錯誤（name）
  'ALREADY FAVORITE': { status: StatusCodes.BAD_REQUEST, message: 'alreadyFavorite' },
  'ALREADY JOINED': { status: StatusCodes.BAD_REQUEST, message: 'alreadyJoined' },
  'GROUP FULL': { status: StatusCodes.BAD_REQUEST, message: 'groupFull' },
}

export const MessagingError = (error, res) => {
  // 檢查 error.name
  let errorConfig = errorMap[error.name]

  if (!errorConfig) {
    errorConfig = errorMap[error.message]
  }

  if (errorConfig) {
    // ValidationError 特殊處理
    if (errorConfig.isValidation) {
      const key = Object.keys(error.errors)[0]
      return res.status(errorConfig.status).json({
        success: false,
        message: error.errors[key].message,
      })
    }

    // MongoDB Duplicate Key 特殊檢查
    if (errorConfig.checkFn && errorConfig.checkFn(error)) {
      return res.status(errorConfig.status).json({
        success: false,
        message: errorConfig.message,
      })
    }

    // 一般錯誤
    return res.status(errorConfig.status).json({
      success: false,
      message: errorConfig.message,
    })
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'serverError',
  })
}
