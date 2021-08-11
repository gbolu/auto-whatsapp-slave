const anonMessenger = require("./anonMessenger");
const statusUpdateQueue = require('./statusUpdateQueue');
const logger = require('./logger');

const autoWhatsAppProcessor = function(job, done) {
  const { id, message, phone_number, messengerTransport } = job.data;

  let processor;
  
  if (messengerTransport === "whatsapp") {
    processor = anonMessenger.sendWhatsAppMessage.bind(anonMessenger);
  }

  if (messengerTransport === "text") {
    processor = anonMessenger.sendTextMessage.bind(anonMessenger);
  }

  return anonMessenger
    .validateMessage(message)
    .then(() => processor(phone_number, message))
    .then(() => {
      logger.info("Job done!");
      return statusUpdateQueue.add(
        { id, status: "successful" },
        { attempts: 3, removeOnComplete: true }
      );
    })
    .then(() => {
      done(null);
    })
    .catch((err) => {
      done(err);
    });
}

module.exports = autoWhatsAppProcessor;