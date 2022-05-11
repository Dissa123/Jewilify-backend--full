const mongoose = require('mongoose');
const User = require("./auth/auth.model");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
require('dotenv').config();

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
      useUnifiedTopology: true
    })

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Method not allowed",
      }),
      headers,
    };
  }

  const body = JSON.parse(event.body);

  if (!validateEmail(body.email)) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Invalid Email Pattern",
      }),
      headers,
    };
  }

  try {
    const user = await User.findOne({ email: body.email });

    if (!user) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "User Not found.",
        }),
        headers,
      };
    }

    const passwordIsValid = bcrypt.compareSync(body.password, user.password);

    if (!passwordIsValid) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Invalid Password. Pls check !",
        }),
        headers,
      };
    }

    var token = jwt.sign({ id: user.id }, "M7HTLPdYICMz8sXCJz_leZmo", {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully signed in!",
        user: {
          _id: user._id,
          email: user.email,
          accessToken: token,
        },
      }),
      headers,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
      headers,
    };
  }
}

//email pattern validation
function validateEmail(mail) {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail);
}
