require('dotenv').config();
const { JCS_MONGO_INST } = process.env


var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true,
  useUnifiedTopology: true, useFindAndModify: false}).catch((err) => {
    //error, its handled now!
  });
var Schema = mongoose.Schema;

var inventoryDataSchema = new Schema(
  {
    id: { type: String, required: false },
    assetId: { type: String, required: false },
    categoryAbr: { type: String, required: false },
    stockno: { type: String, required: false },
    brand: { type: String, required: false },
    styleNumber: { type: String, required: false },
    qty: { type: Number, required: false },
    sku: { type: String, required: false },
    storeCode: { type: String, required: false },
    companyName: { type: String, required: false },
    productName: { type: String, required: false },
    companyCode: { type: String, required: false },
    manufacture: { type: String, required: false },
    tag: { type: String, required: false },
    datebuy: { type: String, required: false },
    datesold: { type: String, required: false },
    shortDescription: { type: String, required: false },
    longDescription: { type: String, required: false },
    cost: { type: String, required: false },
    retailPrice: { type: String, required: false },
    onSale: { type: String, required: false },
    productImages: { type: [], required: false },
    prodCertificatePicture: { type: String, required: false },
    certificateNumber: { type: String, required: false },
    labCertification: { type: String, required: false },
    attributes: {
      style: { type: String, required: false },
      styleName: { type: String, required: false },
      stoneClass: { type: String, required: false },
      gemstoneType: { type: String, required: false },
      stoneCut: { type: String, required: false },
      stoneShape: { type: String, required: false },
      stoneColor: { type: String, required: false },
      stoneClarity: { type: String, required: false },
      centerStoneCT: { type: String, required: false },
      ctw: { type: String, required: false },
      gender: { type: String, required: false },
      metalType: { type: String, required: false },
      metalColor: { type: String, required: false },
      goldKarat: { type: String, required: false },
      metalFinish: { type: String, required: false },
      metalColorAvailability: { type: String, required: false },
      ringSize: { type: String, required: false },
      ringWidth: { type: String, required: false },
      chainType: { type: String, required: false },
      chainLength: { type: String, required: false },
      chainWidth: { type: String, required: false },
      hoopDiameter: { type: String, required: false },
      centerSize: { type: String, required: false },
      pendantHeight: { type: String, required: false },
      pendantWidth: { type: String, required: false },
      prodWeight: { type: String, required: false },
      totalCaratWeight: { type: String, required: false }
    },
    shippingLength: { type: String, required: false },
    shippingWidth: { type: String, required: false },
    shippingHeight: { type: String, required: false },
    jewelryType: { type: String, required: false },
    syncTime: { type: String, required: false },
    createdUser: { type: String, required: false },
    orders_IDs:{type:[],require:false},
    parentId:{type:String,required:false},
    variationID:{type:String,required:false,default : null},
  }
  , { collection: 'pos-inventory' })

var InventoryData = mongoose.model('InventoryData', inventoryDataSchema);

module.exports = InventoryData;
