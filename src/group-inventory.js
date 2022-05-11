require("dotenv").config();
var WooCommerceAPI = require("woocommerce-api");
var jwt = require("jsonwebtoken");
var axios = require("axios");

var InventoryData = require("/connectors/mongo-jcs-connector");

exports.handler = async (event, context) => {

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };

  var wooCommerce = new WooCommerceAPI({
    url: "https://tgtgoldsmiths.thedmgoc.com",
    consumerKey: "ck_2c596764bf7911f0458218e05cf4b49c2081fb67",
    consumerSecret: "cs_9952b08c87398c31f481f741ec69a8a221bbf45c",
    wpAPI: true,
    version: "wc/v1",
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

  //POST Products by SKU
  if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.styleNumber &&
    event.queryStringParameters.type
  ) {
    if (event.queryStringParameters.type != "grouped") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "type value is not valid. (only valid grouped)",
        }),
        headers,
      };
    }
    const inventoryInfo = await InventoryData.find({
      styleNumber: event.queryStringParameters.styleNumber,
      variationID:null || undefined || "",
       createdUser: decoded.id,
    });
    console.log(inventoryInfo);

    if (inventoryInfo.length==0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given styleNumber or all products are grouped already  !",
        }),
        headers,
      };
    }

    var style = [];
    var styleName = [];
    var stoneClass = [];
    var gemstoneType = [];
    var stoneCut = [];
    var stoneShape = [];
    var stoneColor = [];
    var stoneClarity = [];
    var centerStoneCT = [];
    var ctw = [];
    var gender = [];
    var metalType = [];
    var metalColor = [];
    var goldKarat = [];
    var metalFinish = [];
    var metalColorAvailability = [];
    var ringSize = [];
    var ringWidth = [];
    var chainType = [];
    var chainLength = [];
    var chainWidth = [];
    var hoopDiameter = [];
    var centerSize = [];
    var pendantHeight = [];
    var pendantWidth = [];
    var prodWeight = [];
    var totalCaratWeight = [];

    var productVariations = [];

    const mapInventory = await inventoryInfo.map((items) => {
      var variation = {
        sku:items.sku,
        qty:items.qty,
        regular_price: `${items.retailPrice}`,
        attributes: [],
      };

      if (
        items.attributes.style != null &&
        items.attributes.style != "" &&
        items.attributes.style != undefined
      ) {
        style.push(items.attributes.style);
        var att = {
          id: 27,
          option: `${items.attributes.style}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.styleName != null &&
        items.attributes.styleName != "" &&
        items.attributes.styleName != undefined
      ) {
        styleName.push(items.attributes.styleName);
        var att = {
          id: 28,
          option: `${items.attributes.styleName}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.stoneClass != null &&
        items.attributes.stoneClass != "" &&
        items.attributes.stoneClass != undefined
      ) {
        stoneClass.push(items.attributes.stoneClass);
        var att = {
          id: 4,
          option: `${items.attributes.stoneClass}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.gemstoneType != null &&
        items.attributes.gemstoneType != "" &&
        items.attributes.gemstoneType != undefined
      ) {
        gemstoneType.push(items.attributes.gemstoneType);
        var att = {
          id: 5,
          option: `${items.attributes.gemstoneType}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.stoneCut != null &&
        items.attributes.stoneCut != "" &&
        items.attributes.stoneCut != undefined
      ) {
        stoneCut.push(items.attributes.stoneCut);
        var att = {
          id: 6,
          option: `${items.attributes.stoneCut}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.stoneShape != null &&
        items.attributes.stoneShape != "" &&
        items.attributes.stoneShape != undefined
      ) {
        stoneShape.push(items.attributes.stoneShape);
        var att = {
          id: 7,
          option: `${items.attributes.stoneShape}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.stoneColor != null &&
        items.attributes.stoneColor != "" &&
        items.attributes.stoneColor != undefined
      ) {
        stoneColor.push(items.attributes.stoneColor);
        var att = {
          id: 8,
          option: `${items.attributes.stoneColor}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.stoneClarity != null &&
        items.attributes.stoneClarity != "" &&
        items.attributes.stoneClarity != undefined
      ) {
        stoneClarity.push(items.attributes.stoneClarity);
        var att = {
          id: 9,
          option: `${items.attributes.stoneClarity}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.centerStoneCT != null &&
        items.attributes.centerStoneCT != "" &&
        items.attributes.centerStoneCT != undefined
      ) {
        centerStoneCT.push(items.attributes.centerStoneCT);
        var att = {
          id: 10,
          option: `${items.attributes.centerStoneCT}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.ctw != null &&
        items.attributes.ctw != "" &&
        items.attributes.ctw != undefined
      ) {
        ctw.push(items.attributes.ctw);
        var att = {
          id: 11,
          option: `${items.attributes.ctw}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.gender != null &&
        items.attributes.gender != "" &&
        items.attributes.gender != undefined
      ) {
        gender.push(items.attributes.gender);
        var att = {
          id: 12,
          option: `${items.attributes.gender}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.metalType != null &&
        items.attributes.metalType != "" &&
        items.attributes.metalType != undefined
      ) {
        metalType.push(items.attributes.metalType);
        var att = {
          id: 13,
          option: `${items.attributes.metalType}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.metalColor != null &&
        items.attributes.metalColor != "" &&
        items.attributes.metalColor != undefined
      ) {
        metalColor.push(items.attributes.metalColor);
        var att = {
          id: 14,
          option: `${items.attributes.metalColor}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.goldKarat != null &&
        items.attributes.goldKarat != "" &&
        items.attributes.goldKarat != undefined
      ) {
        goldKarat.push(items.attribute.goldKarat);
        var att = {
          id: 15,
          option: `${items.attributes.goldKarat}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.metalFinish != null &&
        items.attributes.metalFinish != "" &&
        items.attributes.metalFinish != undefined
      ) {
        metalFinish.push(items.attributes.metalFinish);
        var att = {
          id: 16,
          option: `${items.attributes.metalFinish}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.ringSize != null &&
        items.attributes.ringSize != "" &&
        items.attributes.ringSize != undefined
      ) {
        ringSize.push(items.attributes.ringSize);
        var att = {
          id: 18,
          option: `${items.attributes.ringSize}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.ringWidth != null &&
        items.attributes.ringWidth != "" &&
        items.attributes.ringWidth != undefined
      ) {
        ringWidth.push(items.attributes.ringWidth);
        var att = {
          id: 19,
          option: `${items.attributes.ringWidth}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.chainType != null &&
        items.attributes.chainType != "" &&
        items.attributes.chainType != undefined
      ) {
        chainType.push(items.attributes.chainType);
        var att = {
          id: 20,
          option: `${items.attributes.chainType}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.chainLength != null &&
        items.attributes.chainLength != "" &&
        items.attributes.chainLength != undefined
      ) {
        chainLength.push(items.attributes.chainLength);
        var att = {
          id: 21,
          option: `${items.attributes.chainLength}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.hoopDiameter != null &&
        items.attributes.hoopDiameter != "" &&
        items.attributes.hoopDiameter != undefined
      ) {
        hoopDiameter.push(items.attributes.hoopDiameter);
        var att = {
          id: 23,
          option: `${items.attributes.hoopDiameter}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.centerSize != null &&
        items.attributes.centerSize != "" &&
        items.attributes.centerSize != undefined
      ) {
        centerSize.push(items.attributes.centerSize);
        var att = {
          id: 29,
          option: `${items.attributes.centerSize}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.pendantHeight != null &&
        items.attributes.pendantHeight != "" &&
        items.attributes.pendantHeight != undefined
      ) {
        pendantHeight.push(items.attributes.pendantHeight);
        var att = {
          id: 24,
          option: `${items.attributes.pendantHeight}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.pendantWidth != null &&
        items.attributes.pendantWidth != "" &&
        items.attributes.pendantWidth != undefined
      ) {
        pendantWidth.push(items.attributes.pendantWidth);
        var att = {
          id: 25,
          option: `${items.attributes.pendantWidth}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.metalColorAvailability != null &&
        items.attributes.metalColorAvailability != "" &&
        items.attributes.metalColorAvailability != undefined
      ) {
        metalColorAvailability.push(items.attributes.metalColorAvailability);
        var att = {
          id: 17,
          option: `${items.attributes.metalColorAvailability}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.chainWidth != null &&
        items.attributes.chainWidth != "" &&
        items.attributes.chainWidth != undefined
      ) {
        chainWidth.push(items.attributes.chainWidth);
        var att = {
          id: 22,
          option: `${items.attributes.chainWidth}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.prodWeight != null &&
        items.attributes.prodWeight != "" &&
        items.attributes.prodWeight != undefined
      ) {
        prodWeight.push(items.attributes.prodWeight);
        var att = {
          id: 26,
          option: `${items.attributes.prodWeight}`,
        };
        variation.attributes.push(att);
      }
      if (
        items.attributes.totalCaratWeight != null &&
        items.attributes.totalCaratWeight != "" &&
        items.attributes.totalCaratWeight != undefined
      ) {
        totalCaratWeight.push(items.attributes.totalCaratWeight);
        var att = {
          id: 26,
          option: `${items.attributes.totalCaratWeight}`,
        };
        variation.attributes.push(att);
      }
      productVariations.push(variation)
      return variation
    });

    const setAtt = await Promise.all(mapInventory);
     
    var attOptions = [
      style,
      styleName,
      stoneClass,
      gemstoneType,
      stoneCut,
      stoneShape,
      stoneColor,
      stoneClarity,
      centerStoneCT,
      ctw,
      gender,
      metalType,
      metalColor,
      goldKarat,
      metalFinish,
      metalColorAvailability,
      ringSize,
      ringWidth,
      chainType,
      chainLength,
      chainWidth,
      hoopDiameter,
      centerSize,
      pendantHeight,
      pendantWidth,
      prodWeight,
      totalCaratWeight
    ];
    var parentId=""
    var variation_id=""
    var child_IDs=[]
    var getAtt= await createAttributes(attOptions)

    var parentData = await mapParentData(inventoryInfo[0],getAtt);
    await wooCommerce
        .postAsync("products", parentData)
        .then(async (response) => {
          
          var resp = JSON.parse(response.body);
          console.log(resp);
          parentId=resp.id?resp.id:resp.data.resource_id;
          console.log(parentId)
        })

        const createVariation=await productVariations.map(async (item)=>{
            var data= await mapData(item.regular_price,item.attributes,item)
            await axios.post(`https://tgtgoldsmiths.thedmgoc.com/wp-json/wc/v3/products/${parentId}/variations?consumer_key=ck_2c596764bf7911f0458218e05cf4b49c2081fb67&consumer_secret=cs_9952b08c87398c31f481f741ec69a8a221bbf45c`, data)
        .then(async (response) => {
          console.log((response.data));
          var resp = (response.data);
          child_IDs.push(resp.id)
          variation_id=resp.id

          try {
            await InventoryData.findOneAndUpdate(
              {
                sku: item.sku,
                createdUser: decoded.id,
              },
              { $set: {variationID:variation_id,
                parentId: parentId,
              } }
            );
          } catch (error) {
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "failed!",
              }),
              headers,
            };
          }
        }).catch((err) => {
          console.log(err)
        });
        })

        const done = await Promise.all(createVariation);
    
    return {
      statusCode: 200,
      body: JSON.stringify({  parentId: parentId,child_IDs:child_IDs }),
      headers,
    };
  }

  //get woo commerce grouped data
  if (
    event.httpMethod == "GET" &&
    event.queryStringParameters.styleNumber &&
    event.queryStringParameters.type
  ) {
    if (event.queryStringParameters.type != "grouped") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "type value is not valid. (only valid grouped)",
        }),
        headers,
      };
    }
    const inventoryInfo = await InventoryData.find({
      //createdUser: decoded.id, 
      styleNumber: event.queryStringParameters.styleNumber,
      variationID:{$nin:["",null]}
    });
    //console.log("1");

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given styleNumber!",
        }),
        headers,
      };
    }
    var parentId=inventoryInfo[0].parentId
    var resp=''

    console.log(parentId);

    await axios.get(`https://tgtgoldsmiths.thedmgoc.com/wp-json/wc/v3/products/${parentId}/variations?consumer_key=ck_2c596764bf7911f0458218e05cf4b49c2081fb67&consumer_secret=cs_9952b08c87398c31f481f741ec69a8a221bbf45c`)
      .then(async (response) => {
        console.log(response.data);
        resp = response.data;
      })
      .catch((error) => {
        //console.log(error.response.data);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "failed!",
          }),
          headers,
        };
      });

    return {
      statusCode: 200,
      body: JSON.stringify({ products: resp }),
      headers,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Method not allowed",
    }),
    headers: { "Access-Control-Allow-Origin": "*" },
  };
};

const mapData = async (retailPrice,att,item) => {
  const wooObj = {
    regular_price: retailPrice ? `${retailPrice}` : "0.00",
    sku: `variation-${item.sku}`,
    stock_quantity:item.qty,
    attributes: att?att:[],
    images: await mapWooImage(item.productImages)
  };
  return wooObj;
};

const mapParentData = (item,att) => {
  const wooObj = {
    name: item.productName ? item.productName : "Premium Quality",
    sku: item.styleNumber ? item.styleNumber : "",
    sold_individually: true,
    type: "variable",
    description: item.longDescription
      ? item.longDescription
      : "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.",
    short_description: item.shortDescription
      ? item.shortDescription
      : "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    attributes:att?att:[],
    images: [
      /* item.productImages.length>0?item.productImages.map((a)=>{
        return {src: "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_front.jpg"}
      }): */
      {
        src: "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_front.jpg",
      },
      {
        src: "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_back.jpg",
      },
    ],
  };
  return wooObj;
};

const createAttributes =async (item) => {
  var attribute=[]
  const maping=await item.map((data,id)=>{
    if(data.length>0){
      var d={
        id: id+4,
        position: 0,
        options: data,
        variation:true,
        visible:true
      }
      attribute.push(d)
    }
   
  })
  const setAtt = await Promise.all(maping);
  return attribute
  
};


const mapWooImage=(item)=>{
  var imageArr=[]
  if(item.length>0){
    for(let i=0;i<item.length;i++){
      imageArr.push({
        position : i,
        src : item[i]})
    }
  }
  console.log(imageArr)
  return imageArr
}
