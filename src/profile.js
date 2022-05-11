require('dotenv').config();
const User = require("./auth/auth.model");
var jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

exports.handler = async (event, context) => {

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };

  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    .then(() => {
      console.log("Successfully connected to MongoDB.");
    })
    .catch(err => {
      console.error("Connection error", err);
      process.exit();
    });


  var decoded;

  try {
    decoded = jwt.verify(
      event.headers.authorization,
      "M7HTLPdYICMz8sXCJz_leZmo"
    );
    if (!decoded) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No token provided!",
        }),
        headers,
      };
    }
    //jwt.verify(token, process.env.SECRET, {});
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Unauthorized!",
      }),
      headers,
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Method not allowed'
      }),
      headers: { "Access-Control-Allow-Origin": "*" }
    };
  }

  let body = JSON.parse(event.body);
  console.log(decoded.id)
  console.log(body)

  try {
    await User.findOneAndUpdate(
      {email: decoded.id},{$set:body});
      
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "update failed",
      }),
      headers,
    };
  }    

return {
  statusCode: 200,
  body: JSON.stringify({
    message: "You have successfully updated.",
  }),
  headers,
};

}