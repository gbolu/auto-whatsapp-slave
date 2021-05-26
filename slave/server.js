const express = require('express');

const app = express();

app.use(express.json());

app.get('/isAvailable', (req, res, next) => {
    

    return res.status(200).json({
        status: 'success',
        code: res.statusCode,
        data: null,
        message: 'Server is available for processing.'
    });
})