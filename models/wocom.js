const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require('joi');


const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  consumerKey: { type: Number, required: true },
});
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this_id }, process.env.JWTPRIVATEKEY, {
    expiresIn: "9d",
  });
  return token;
};

const User =  mongoose.model("user",userSchema);
