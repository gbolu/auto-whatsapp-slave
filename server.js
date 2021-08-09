require('dotenv').config();
const { createServer } = require('http');
const app = require('./app');
const cleanWhatsappQueue = require('./utils/cleanWhatsappQueue');
const logger = require('./utils/logger');
const whatsappQueue = require('./utils/whatsappQueue');

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
    await cleanWhatsappQueue();
    logger.info("Cleaned AutoWhatsApp Queue...");
  } catch (error) {
    logger.error(error);
  }
})()

server.listen(port, () => {
  logger.info(`Slave Server is listening on port:${port}`);
})

process.on('unhandledRejection', (err) => {
  logger.error(err.name, err.message);
  logger.error('UNHANDLED REJECTION! 😞 Shutting down Server...');
 
  server.close(async () => {
    await whatsappQueue.close();
    logger.info("WhatsApp Queue closed...");
    process.exit(1);
  });
});
