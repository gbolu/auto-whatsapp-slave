const express = require('express');
const whatsappQueue = require('../queueMaster');
const app = express();
app.use(express.json());

app.post('/', async (req, res, next) => {
    console.log("Request recieved.");
    if(!req.body.message || !req.body.phone_number){
        return res.status(400).json({
            code: res.statusCode,
            status: 'fail',
            message: 'The message and phone number are required fields.',
            data: null 
        })
    }

    const {message_id, message, phone_number} = req.body;

    whatsappQueue.add({id, message, phone_number}, {attempts: 2})

    return res.status(200).json({
        code: res.statusCode,
        message: `Message sent successfully to ${phone_number}`,
        status: 'success',
        data: {
            message,
            phone_number
        }
    })
})

app.listen(80, () => {
    console.log('Server is listening...')
})
