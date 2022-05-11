require('dotenv').config();
const { JCS_MONGO_INST } = process.env


var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true,
  useUnifiedTopology: true, useFindAndModify: false});
var Schema = mongoose.Schema;

var orderDataSchema = new Schema(
  {
    order:{type:{},required:false},
    order_status:{type:String,required:false},
    order_id:{type:String,required:false},
  }
  , { collection: 'orders' })

var OrderData = mongoose.model('OrderData', orderDataSchema);

module.exports = OrderData;
