const express = require('express');
const messagesRouter = express.Router();

const sendMessageController = require('../controllers/message/sendMessageController');

messagesRouter.post("/send", sendMessageController);

module.exports = messagesRouter;
