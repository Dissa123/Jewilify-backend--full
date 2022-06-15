const express = require("express");
const { imageModel, uploadImage } = require("../models/imageModel");
const router = express.Router();

// localhost:9000/user/upload
router.post("/upload", uploadImage, imageModel);

module.exports = router;
