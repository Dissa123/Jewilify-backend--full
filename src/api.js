const express = require("express");
const serverless = require("serverless-http");
const authRouter = require('./auth-router');
const bodyParser = require('body-parser');
const cors = require('cors')


const app = express();
var corsOptions = {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      origin: '*',
      optionsSuccessStatus: 200,
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cors())
app.use(`/.netlify/functions/api`, authRouter);

module.exports = app;
module.exports.handler = serverless(app);