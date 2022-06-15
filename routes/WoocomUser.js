const router = require("express").Router();
const { User } = require("../models/wocom");
const Joi = require("joi");
router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ _id: req.body._id });
    if (!user)
      return res.status(401).send({ message: "Invalid ID or Secret ID" });

    const sid = await bcrypt.compare(req.body.consumerKey, user.consumerKey);

    if (!sid) {
      return res.status(401).send({ message: "Invalid ID or Secret ID" });
    }

    const token = user.generateAuthToken();
    res.status(200).send({ data: token, message: "Logged in Successfully" });
  } catch (error) {
    res.status(500).send({message:"internal Server Error.!"})
  }
});

const validate = (data) => {
  const schema = Joi.object({
    _id: Joi.string().email().required().label("_id"),
    consumerKey: Joi.string().required().label("consumerKey"),
  });
  return schema.validate(data);
};
