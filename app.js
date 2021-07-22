const express = require('express');
const whatsappQueue = require('./utils/whatsappQueue');
const app = express();
app.use(express.json());

app.post('/addJob', async (req, res) => {
  if(!req.body.message || !req.body.phone_number){
      return res.status(400).json({
          code: res.statusCode,
          status: 'fail',
          message: 'The message and phone number are required fields.',
          data: null 
      })
  }

  const {id, message, phone_number} = req.body;

  try {
    await whatsappQueue.add({id, message, phone_number});
  } catch (error) {
    // console.log(error);
    return res.status(500).end();
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
})

app.get('/isAvailable', async (req, res, next) => {
  let isAvailable = false;

  if((await whatsappQueue.getActiveCount()) === 0)
  isAvailable = true;

  return res.status(200).json({
      status: 'success',
      code: res.statusCode,
      data: {
        isAvailable
      },
      message: `Slave server: ${req.protocol + '://' + req.get('host')} status retrieved.`
  });
})

module.exports = app;
