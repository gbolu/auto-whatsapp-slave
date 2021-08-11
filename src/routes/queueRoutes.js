const express = require("express");
const queueRouter = express.Router();
const isQueueAvailableController = require('../controllers/queue/isQueueAvailableController');
const getQueueCountController = require('../controllers/queue/getQueueCountController');

queueRouter.get("/isAvailable", isQueueAvailableController);
queueRouter.get("/count", getQueueCountController);

module.exports = queueRouter;
