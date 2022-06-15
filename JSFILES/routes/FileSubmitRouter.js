const express = require("express");
const Post = require("../models/postModel");

const router = express.Router();
const csvtojson = require("csvtojson");


router.post("/add", async (req, res) => {
    csvtojson()
    .formFile("Text.csv")
    .then((cvsData) => {
      console.log(cvsData);
      Post
        .insertMany(cvsData)
        .then(function () {
          console.log("Data Inserted");
          res.json({ success: "Success" });
        })
        .catch(function (error) {
          console.log(error);
        });
    });
});
module.exports = router;
