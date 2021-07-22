require('dotenv').config();
const { createServer } = require('http');
const app = require('./app');
const cleanWhatsappQueue = require('./utils/cleanWhatsappQueue');
const whatsappQueue = require('./utils/whatsappQueue');

// HANDLING UNCAUGHT EXCEPTION ERRORS
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🙄 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const port = process.env.PORT || 4000;

const server = createServer(app);

(async () => {
  try {
    await cleanWhatsappQueue();
    console.log("Cleaned");
  } catch (error) {
    console.log(error);
  }
})()

server.listen(port, () => {
  console.log(`Slave Server is listening on port:${port}`);
})

process.on('unhandledRejection', (err) => {
  console.error(err.name, err.message);
  console.log('UNHANDLED REJECTION! 😞 Shutting down Server...');

  whatsappQueue.close()
  .then((console.log('WhatsApp Queue has been closed...')))
  .catch(err => console.log(err));
  
  server.close(() => {
    process.exit(1);
  });
});
