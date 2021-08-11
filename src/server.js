require('dotenv').config();
const { createServer } = require('http');
const app = require('./app');
const cleanQueue = require('./utils/cleanQueue');
const logger = require('./utils/logger');
const messengerQueue = require('./utils/messengerQueue');
const statusUpdateQueue = require('./utils/statusUpdateQueue');

// HANDLING UNCAUGHT EXCEPTION ERRORS
process.on('uncaughtException', (err) => {
  logger.info('UNCAUGHT EXCEPTION! 🙄 Shutting down...');
  logger.error(err);
  process.exit(1);
});

const port = process.env.PORT || 4000;

const server = createServer(app);

(async () => {
  try {
    await cleanQueue(messengerQueue);
    logger.info(`Cleaned ${messengerQueue.name} Queue...`);

    await cleanQueue(statusUpdateQueue);
    logger.info(`Cleaned ${statusUpdateQueue.name} Queue...`);
  } catch (error) {
    logger.error(error);
  }
})()

server.listen(port, () => {
  logger.info(`Slave Server is listening on port:${port}`);
})

process.on('unhandledRejection', (err) => {
  logger.info(err);
  logger.error('UNHANDLED REJECTION! 😞 Shutting down Server...');
 
  server.close(async () => {
    await messengerQueue.close();
    logger.info(`${messengerQueue.name} Queue closed...`);
    process.exit(1);
  });
});
