const { Response } = require('http-status-codez');
const messengerQueue = require('../../utils/messengerQueue');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

function validateMessage(message='') {
  let messages = message.split('\n');
  messages.forEach(text => {
    //  regex used to check for emojis
    const emojiRegexExp =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;

    //  check for the presence of emojis in text
    let emojiRegexTestResults = emojiRegexExp.exec(text);
    if (emojiRegexTestResults.length !== 0) 
    return false;
  })

  return true;
}

const sendMessageController = catchAsync(async (req, res, next) => {
  const { id, message, phone_number, messengerTransport } = req.body;

  if (!message || !phone_number || !messengerTransport) {
    return next(
      new AppError(
        "Message, phone number or messenger transport were not provided.",
        Response.HTTP_UNPROCESSABLE_ENTITY
      )
    );
  }

  const transports = ["whatsapp", "text"];

  if (messengerTransport && !transports.includes(messengerTransport)) 
  return next(new AppError(`Invalid messenger transport. Valid options are: ${transports.join(", ")}`, Response.HTTP_UNPROCESSABLE_ENTITY))

  try {
    await messengerQueue.add({ id, message, phone_number, messengerTransport });
  } catch (error) {
    return next(new AppError(error.message));
  }

  return res.status(200).json({
    code: res.statusCode,
    message: `Message to ${phone_number} queued successfully.`,
    status: "success",
    data: {
      message,
      phone_number,
    },
  });
});

module.exports = sendMessageController;
