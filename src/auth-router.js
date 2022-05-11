var express = require('express');


let authRouter = express.Router();



authRouter.get('/', (req, res) => {
   return res.send("Jewelify API");
})

module.exports = authRouter;
