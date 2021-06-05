const express = require('express');
const whatsappQueue = require('../utils/whatsappQueue');
const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
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

const clean = async () => {
  await Promise.all([whatsappQueue.empty(), 
  whatsappQueue.clean(10, "active"), 
  whatsappQueue.clean(10, "completed"),
  whatsappQueue.clean(10, "wait"), 
  whatsappQueue.clean(10, "failed")]);
}
app.listen(process.env.PORT || 80, () => {
  console.log('Server is listening...');
  clean().then(() => console.log("Cleaned!"));
})
