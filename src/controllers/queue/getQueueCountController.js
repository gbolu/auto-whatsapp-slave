const whatsappQueue = require("../../utils/messengerQueue");
const catchAsync = require("../../utils/catchAsync");

const getQueueCountController = catchAsync(async (req, res, next) => {
  let count = await whatsappQueue.count();

  return res.status(200).json({
    count,
  });
});

module.exports = getQueueCountController;
