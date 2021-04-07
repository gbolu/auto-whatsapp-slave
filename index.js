const express = require('express');
const app = express();
const sendMessage = require('./sendMessage');
app.use(express.json());

app.post('/', async (req, res, next) => {
    if(!req.body.message || !req.body.phone_number){
        return res.status(400).json({
            code: res.statusCode,
            status: 'fail',
            message: 'The message and phone number are required fields.',
            data: null 
        })
    }

    const {message, phone_number} = req.body;

    try {
        (await sendMessage(message, phone_number))   
    } catch (error) {
        console.log(error)
        return res.status(400).end();   
    }
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

app.listen(5000, () => {
    console.log('Server is listening...')
})