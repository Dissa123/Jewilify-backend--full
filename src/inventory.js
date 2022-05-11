require("dotenv").config();
var jwt = require("jsonwebtoken");
var jcsDataOp = require("/dao/jcs-data-operation");
var WooCommerceAPI = require("woocommerce-api");
var User = require("./auth/auth.model");

var InventoryData = require("/connectors/mongo-jcs-connector");

exports.handler = async (event, res) => {
  console.log(event)
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };
  var decoded;
  var token=event.headers.authorization?event.headers.authorization:event.queryStringParameters.token?event.queryStringParameters.token:'';

  try {
    decoded = jwt.verify(
      token,
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

    const logedUser = await User.findOne({ email: decoded.id });
    console.log(logedUser);
    var wooCommerce = new WooCommerceAPI({
      url: "https://tgtgoldsmiths.thedmgoc.com",
      consumerKey: "ck_2c596764bf7911f0458218e05cf4b49c2081fb67",
      consumerSecret: "cs_9952b08c87398c31f481f741ec69a8a221bbf45c",
      wpAPI: true,
      version: "wc/v1",
    });
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

  //Retrive Butk Products
  if (event.httpMethod == "GET" && !event.queryStringParameters.sku) {
    
    const inventoryInfo = await InventoryData.find({ createdUser: decoded.id });
    var newInventoryInfo = [];
    if (inventoryInfo.length > 0) {
      inventoryInfo.map((item) => {
        var tempData = getDataMap(item);
        newInventoryInfo.push(tempData);
      });
      return {
        statusCode: 200,
        body: JSON.stringify(newInventoryInfo),
         headers,
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No inventory found",
        }),
        headers,}
      ;
    }
  }

  //Retrive Single Products by  SKU
  if (event.httpMethod == "GET" && event.queryStringParameters.sku) {
    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
      createdUser: decoded.id,
    });

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
         headers,
      };
    }

    //console.log(inventoryInfo);
    const data = await getDataMap(inventoryInfo);
    console.log(data);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
       headers,
    };
  }

  //DELETE Products by  SKU in db and wooCom
  if (
    event.httpMethod == "DELETE" &&
    event.queryStringParameters.sku &&
    event.queryStringParameters.type
  ) {
    if (event.queryStringParameters.type != "updateBoth") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "type should be bothUpdate.",
        }),
         headers,
      };
    }
    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
    });
    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
         headers,
      };
    }

    await InventoryData.deleteMany({
      sku: event.queryStringParameters.sku,
    });

    if (inventoryInfo.id) {
      await wooCommerce
        .deleteAsync("products/" + inventoryInfo.id)
        .then(async (response) => {
          // console.log(JSON.parse(response.body));
          console.log(response);
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
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "The product with the SKU " +
          event.queryStringParameters.sku +
          " has been deleted Products removed in both.",
      }),
       headers,
    };
  }

  //DELETE All Products by  SKU
  if (event.httpMethod == "DELETE" && event.queryStringParameters.sku) {
    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
      createdUser: decoded.id,
    });
    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
         headers,
      };
    }

    await InventoryData.deleteMany({
      sku: event.queryStringParameters.sku,
      createdUser: decoded.id,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "The product with the SKU " +
          event.queryStringParameters.sku +
          " has been deleted Products removed.",
      }),
       headers,
    };
  }

  //DELETE Full inventory
  if (event.httpMethod == "DELETE" && !event.queryStringParameters.sku) {
    await InventoryData.deleteMany({ createdUser: decoded.id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Inventory Cleared",
      }),
       headers,
    };
  }

  //post Inventory in db and wooCom
  if (event.httpMethod == "POST" && event.queryStringParameters.type) {
    if (event.queryStringParameters.type != "updateBoth") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "type should be updateBoth.",
        }),
         headers,
      };
    }
    let body = JSON.parse(event.body);
    let responseProducts = [];
    let invalidProducts = [];
    let withoutStyleNumber = [];

    //Iterrating Inventory Products and validating SKU
    body.products.forEach((element) => {
      if (element.sku == null || element.sku == "") {
        invalidProducts.push(element);
      }
      if (element.styleNumber == null || element.styleNumber == "") {
        withoutStyleNumber.push(element);
      }
    });

    if (withoutStyleNumber.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "No style number found in the data",
        }),
         headers,
      };
    }

    if (invalidProducts.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "SKU cannot be empty",
        }),
         headers,
      };
    }
    var alreadySkus = [];
    const prod = body.products;
    const skus = await prod.map(async (item) => {
      const inventoryInfo = await InventoryData.findOne({
        sku: item.sku,
      });

      if (inventoryInfo) {
        alreadySkus.push(item.sku);
      }
    });
    const checkSkus = await Promise.all(skus);
    //console.log(checkSkus);
    console.log(alreadySkus);
    if (alreadySkus.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "this skus already added. : SKU:" + alreadySkus,
        }),
         headers,
      };
    }

    //Iterrating Inventory Products
    var failedSave = [];
    const addData = await body.products.map(async (element, id) => {
      var item = element;
      var wooData = await mapWooData(element);

      item["assetId"] = element.sku;
      item["createdUser"] = decoded.id;
      try {
        await wooCommerce
          .postAsync("products", wooData)
          .then(async (response) => {
            console.log(JSON.parse(response.body));
            var resp = JSON.parse(response.body);
            item["id"] = resp.id ? resp.id : responese.data.resource_id;
            await jcsDataOp.save(item);
            await responseProducts.push(item);
          });
      } catch (error) {
        failedSave.push(item.sku);
      }
    });
    const addResult = await Promise.all(addData);
    console.log(addResult.slice(-1));

    if (failedSave.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "item added failed : SKU:" + failedSave,
        }),
         headers,
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully uploaded your inventory..",
          products: body,
        }),
         headers,
      };
    }
  }

  //post Inventory
  if (event.httpMethod == "POST") {
    let body = JSON.parse(event.body);
    let responseProducts = [];
    let invalidProducts = [];
    let withoutStyleNumber = [];

    //Iterrating Inventory Products and validating SKU
    body.products.forEach((element) => {
      if (element.sku == null || element.sku == "") {
        invalidProducts.push(element);
      }
      if (element.styleNumber == null || element.styleNumber == "") {
        withoutStyleNumber.push(element);
      }
    });

    if (withoutStyleNumber.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "No style number found in the data",
        }),
         headers,
      };
    }

    if (invalidProducts.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "SKU cannot be empty",
        }),
         headers,
      };
    }

    var alreadySkus = [];
    const prod = body.products;
    const skus = await prod.map(async (item) => {
      const inventoryInfo = await InventoryData.findOne({
        sku: item.sku,
      });

      if (inventoryInfo) {
        alreadySkus.push(item.sku);
      }
    });
    const checkSkus = await Promise.all(skus);
    console.log(alreadySkus);
    if (alreadySkus.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "this skus already added. : SKU:" + alreadySkus,
        }),
         headers,
      };
    }

    //Iterrating Inventory Products
    var failedSave = [];
    const addData = await body.products.map(async (element, id) => {
      var item = element;
      item["assetId"] = element.sku;
      item["createdUser"] = decoded.id;

      const results = await InventoryData.findOne({
        sku: element.sku,
        createdUser: decoded.id,
      });
      console.log(results);
      if (!results) {
        try {
          await jcsDataOp.save(item);
          await responseProducts.push(item);
        } catch (error) {
          failedSave.push(item.sku);
        }
      }
      if (id == body.products.length - 1) {
        return "done";
      }
    });
    const addResult = await Promise.all(addData);
    console.log(addResult);

    if (failedSave.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "item added failed : SKU:" + failedSave,
        }),
         headers,
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully uploaded your inventory",
          products: body,
        }),
         headers,
      };
    }
  }

  //Update Inventory in db and wooCom
  if (
    event.httpMethod == "PUT" &&
    event.queryStringParameters.sku &&
    event.queryStringParameters.type
  ) {
    if (event.queryStringParameters.type != "updateBoth") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "type should be bothUpdate.",
        }),
         headers,
      };
    }
    let body = JSON.parse(event.body);

    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
      createdUser: decoded.id,
    });

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
         headers,
      };
    }
    try {
      const mapedData = await mapWooDataPut(body, inventoryInfo);
      await wooCommerce
        .putAsync("products/" + inventoryInfo.id, mapedData)
        .then(async (response) => {
          console.log(JSON.parse(response.body));
          await InventoryData.findOneAndUpdate(
            { sku: event.queryStringParameters.sku, createdUser: decoded.id },
            { $set: body }
          );
        });
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "update failed",
          products: body,
        }),
         headers,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully updated your inventory...",
        products: body,
      }),
       headers,
    };
  }

  //Update Bulk Inventory db and woo
  if (event.httpMethod == "PUT" && event.queryStringParameters.type &&
  !event.queryStringParameters.sku) {

    if (event.queryStringParameters.type != "updateBoth") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "type should be bothUpdate.",
        }),
         headers,
      };
    }

    let body = JSON.parse(event.body);
    // var item = body;
    var invalidSkus = [];
    var updateFailed = [];
    var withoutStyleNo = [];

    console.log(event.body.products);

    const update = await body.products.map(async (element) => {

      const data = await InventoryData.findOne({
        sku: element.sku,
        createdUser: decoded.id,
      });
      if (!data) {
        invalidSkus.push(element.sku);
      } else {

        try {
          const mapedData = await mapWooDataPut(element, data);
          await wooCommerce
            .putAsync("products/" + data.id, mapedData)
            .then(async (response) => {
              console.log(JSON.parse(response.body));
              await InventoryData.findOneAndUpdate(
                { sku: element.sku, createdUser: decoded.id },
                { $set: element }
              );
            });
        } catch (error) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: "update failed",
              products: body,
            }),
             headers,
          };
        }

        /* try {
          await InventoryData.findOneAndUpdate(
            { sku: element.sku,createdUser: decoded.id, },
            { $set: element }
          );
        } catch (error) {
          updateFailed.push(element.sku);
        } */
      }
    });
    await Promise.all(update);
    if (invalidSkus.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "No sku found in the data. SKUS : " + invalidSkus,
        }),
         headers,
      };
    }
    if (updateFailed.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "update Failed SKUS : " + updateFailed,
        }),
         headers,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully updated your inventory",
        products: body,
      }),
       headers,
    };
  }

  //Update Inventory
  if (event.httpMethod == "PUT" && event.queryStringParameters.sku) {
    let body = JSON.parse(event.body);

    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
      createdUser: decoded.id,
    });

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
         headers,
      };
    }
    try {
      await InventoryData.findOneAndUpdate(
        { sku: event.queryStringParameters.sku,createdUser: decoded.id, },
        { $set: body }
      );
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "update failed",
          products: body,
        }),
         headers,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully updated your inventory",
        products: body,
      }),
       headers,
    };
  }

  //Update Bulk Inventory
  if (event.httpMethod == "PUT" &&
  !event.queryStringParameters.sku &&
  !event.queryStringParameters.type) {
    let body = JSON.parse(event.body);
    // var item = body;
    var invalidSkus = [];
    var updateFailed = [];
    var withoutStyleNo = [];

    console.log(event.body.products);

    const update = await body.products.map(async (element) => {
      if (element.styleNumber == null || element.styleNumber == "") {
        withoutStyleNo.push(element.sku);
      }

      const data = await InventoryData.findOne({
        sku: element.sku,
        createdUser: decoded.id,
      });
      if (!data) {
        invalidSkus.push(element.sku);
      } else {
        try {
          await InventoryData.findOneAndUpdate(
            { sku: element.sku,createdUser: decoded.id, },
            { $set: element }
          );
        } catch (error) {
          updateFailed.push(element.sku);
        }
      }
    });
    await Promise.all(update);
    if (invalidSkus.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "No sku found in the data. SKUS : " + invalidSkus,
        }),
         headers,
      };
    }
    if (updateFailed.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: false,
          message: "update Failed SKUS : " + updateFailed,
        }),
         headers,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully updated your inventory",
        products: body,
      }),
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

const getDataMap = (item) => {
  const obj = {
    categoryAbr: item.categoryAbr ? item.categoryAbr : "",
    stockno: item.stockno ? item.stockno : "",
    styleNumber: item.styleNumber ? item.styleNumber : "",
    brand: item.brand ? item.brand : "",
    manufacture: item.manufacture ? item.manufacture : "",
    tag: item.tag ? item.tag : "",
    storeCode: item.storeCode ? item.storeCode : "",
    productName: item.productName ? item.productName : "",
    companyName: item.companyName ? item.companyName : "",
    companyCode: item.companyCode ? item.companyCode : "",
    qty: item.qty ? item.qty : "",
    sku: item.sku ? item.sku : "",
    datebuy: item.datebuy ? item.datebuy : "",
    datesold: item.datesold ? item.datesold : "",
    shortDescription: item.shortDescription ? item.shortDescription : "",
    longDescription: item.longDescription ? item.longDescription : "",
    cost: item.cost ? item.cost : "",
    retailPrice: item.retailPrice ? item.retailPrice : "",
    onSale: item.onSale ? item.onSale : "",
    productImages: item.productImages ? item.productImages : "",
    prodCertificatePicture: item.prodCertificatePicture
      ? item.prodCertificatePicture
      : "",
    certificateNumber: item.certificateNumber ? item.certificateNumber : "",
    labCertification: item.labCertification ? item.labCertification : "",
    attributes: item.attributes ? item.attributes: [],
    shippingLength: item.shippingLength ? item.shippingLength : "",
    shippingWidth: item.shippingWidth ? item.shippingWidth : "",
    shippingHeight: item.shippingHeight ? item.shippingHeight : "",
    jewelryType: item.jewelryType ? item.jewelryType : "",
    assetId: item.assetId ? item.assetId : "",
  };
  return obj;
};

const mapWooData = async (item) => {
  const wooObj = {
    name: item.productName ? item.productName : "Premium Quality",
    sku: item.sku ? item.sku : "",
    stock_quantity:`${item.qty}`?item.qty:"",
    type: "simple",
    manage_stock:true,
    regular_price: item.retailPrice ? `${item.retailPrice}` : "0.00",
    description: item.longDescription
      ? item.longDescription
      : "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.",
    short_description: item.shortDescription
      ? item.shortDescription
      : "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
      images: await mapWooImage(item.productImages)
  };
  return wooObj;
};

const mapWooDataPut = (item, db) => {
  const wooObj = {
    name: item.productName ? item.productName : db.productName,
    sku: item.sku ? item.sku : db.sku,
    stock_quantity:item.qty?`${item.qty}`:`${db.qty}`,
    type: "simple",
    manage_stock:true,
    regular_price: item.retailPrice
      ? `${item.retailPrice}`
      : `${db.retailPrice}`,
    description: item.longDescription
      ? item.longDescription
      : db.longDescription,
    short_description: item.shortDescription
      ? item.shortDescription
      : db.shortDescription,
  };
  return wooObj;
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
