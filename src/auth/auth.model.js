const mongoose = require("mongoose");

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        _id: String,
        email: String,
        password: String,
        consumerSecret:String,
        consumerKey:String,
        companyName:String,
        ecomService:String,
        host:String


    })
);

module.exports = User;