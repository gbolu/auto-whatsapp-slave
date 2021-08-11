const { Response } = require('http-status-codez');
const express = require('express');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/globalErrorHandler');
const expressWinston = require('express-winston');
const winston = require('winston');
const messagesRouter = require('./routes/messageRoutes');
const queueRouter = require('./routes/queueRoutes');

const app = express();

app.use(express.json());

app.use('/message', messagesRouter);
app.use('/queue', queueRouter);

app.all("*", async (req, res, next) => {
  return next(
    new AppError(
      `Can't find ${req.originalUrl} on this Server!`,
      Response.HTTP_NOT_FOUND
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
