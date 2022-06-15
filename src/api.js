const express = require("express");
const serverless = require("serverless-http");
const authRouter = require("./auth-router");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("../routes/WoocomUser");

// image Section
const { imageRoute } = require("../routes/photoUploaderRoute");
// const router = express.Router;

// const csvModel = require("../models/postModel");
// var csv = require("csvtojson");
const app = express();
var corsOptions = {
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.use(`/.netlify/functions/api`, authRouter);

app.use(`/.netlify/functions/api/users`,userRouter)
module.exports = app;
module.exports.handler = serverless(app);

// Image Section
app.use("/image", imageRoute);

app.listen(9000, () => {
  console.log("Server is Running...!");
});
