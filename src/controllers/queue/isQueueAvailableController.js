const whatsappQueue = require("../../utils/messengerQueue");
const catchAsync = require("../../utils/catchAsync");

const isQueueAvailableController = catchAsync(async (req, res, next) => {
  const isAvailable = ((await whatsappQueue.getActiveCount()) === 0) 

  return res.status(200).json({
    status: "success",
    code: res.statusCode,
    data: {
      isAvailable,
    },
    message: `Slave server: ${req.protocol}://${req.get("host")} status retrieved.`,
  });
});

module.exports = isQueueAvailableController;
