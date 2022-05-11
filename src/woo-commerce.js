require("dotenv").config();
var WooCommerceAPI = require("woocommerce-api");
var jwt = require("jsonwebtoken");
var InventoryData = require("/connectors/mongo-jcs-connector");
var OrderData = require("/connectors/order");
var mongoose = require("mongoose");
var jcsDataOp = require("/dao/jcs-data-operation");
var axios = require("axios");

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

  // wwebhooks
  if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "create_order_webhook"
  ) {
    console.log("done");
    let body = JSON.parse(event.body);
    const order = await new OrderData({ order: body, order_status: body.status ,order_id:body.id});
    await order.save().catch((err) => {
      //error, its handled now!
    });

    const chngeQty = body.line_items.map(async (item) => {
      if (
        item.variation_id == 0 ||
        item.variation_id == undefined ||
        item.variation_id == null ||
        item.variation_id == ""
      ) {
        var qty = parseInt(item.quantity);
        var orders = [body.id];

        let prevData = await InventoryData.findOne({ id: item.product_id });

        qty = parseInt(prevData.qty) - qty;
        let orders_IDs =
          prevData.orders_IDs.length > 0
            ? orders.concat(prevData.orders_IDs)
            : orders;

        await InventoryData.findOneAndUpdate(
          { id: item.product_id },
          { $set: { qty: qty, orders_IDs: orders_IDs } }
        );
      }else{
        var qty = parseInt(item.quantity);
        var orders = [body.id];

        let prevData = await InventoryData.findOne({ variationID:item.variation_id});

        qty = parseInt(prevData.qty) - qty;
        let orders_IDs =
          prevData.orders_IDs.length > 0
            ? orders.concat(prevData.orders_IDs)
            : orders;

        await InventoryData.findOneAndUpdate(
          { sku: prevData.sku },
          { $set: { qty: qty, orders_IDs: orders_IDs } }
        );
      }
    });

    const finalResult = await Promise.all(chngeQty);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "order added",
      }),
      headers,
    };
  }else if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "update_order_webhook"
  ) {
    console.log("done");
    let body = JSON.parse(event.body);
      await OrderData.findOneAndUpdate(
        {order_id:body.id},
        { order: body, order_status: body.status }).catch((err) => {
          //error, its handled now!
        });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "order updated",
      }),
      headers,
    };
  }else if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "delete_order_webhook"
  ) {
    console.log("done");
    let body = JSON.parse(event.body);
      await OrderData.deleteMany(
        {order_id:body.id}).catch((err) => {
          //error, its handled now!
        });

       await InventoryData.updateMany(
        {orders_IDs:{$in:[body.id]}},
        {$pull :{orders_IDs:{ $eq: body.id }}}
        ).catch((err) => {
          //error, its handled now!
        });


    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "order deleted",
      }),
      headers,
    };
  }else if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "update_product_webhook"
  ) {
    let body = JSON.parse(event.body);
    console.log("update")
    
   if(body.type=='simple'){
      const data=await setSimpleProductWebhook(body)
      await InventoryData.findOneAndUpdate({id:body.id},{
        $set:data,
      }).catch((err) => {
        //error, its handled now!
      });
    } else if(body.type=='variable'){

      if(body.parent_id==0){
        await InventoryData.deleteMany({parentId:body.id,variationID:{$nin:body.variations}}).catch((err) => {
          //error, its handled now!
        });
        console.log(body)
        if(body.variations!=[]){
          var variRes=""
          const addnew = await body.variations.map(async (i) => {
            const inventoryinfo=await InventoryData.findOne({variationID:i})
            if(!inventoryinfo){
              await axios.get(`https://tgtgoldsmiths.thedmgoc.com/wp-json/wc/v3/products/${body.id}/variations/${i}?consumer_key=ck_2c596764bf7911f0458218e05cf4b49c2081fb67&consumer_secret=cs_9952b08c87398c31f481f741ec69a8a221bbf45c`)
        .then(async (response) => {
         //console.log(response.data);
          variRes = response.data;
        })
        .catch((error) => {
          //console.log(error.response.data);
        });
        const dbObj=await setParentProductWebhook(body)
        const dbObj2=await setProductWebhookVariations(variRes)
        //console.log(dbObj)
        const newobj = {
          ...dbObj,
          ...dbObj2
      };
     // console.log(dbObj)
      await jcsDataOp.save(newobj).catch((err) => {
        //error, its handled now!
      });
            }
          })
           const abc = await Promise.all(addnew).catch((err) => {
            console.log(err)
          });

        }
        const dbObj=await setParentProductWebhook(body)
         await InventoryData.updateMany({parentId:body.id},{
        $set:dbObj,
      }).catch((err) => {
        //error, its handled now!
      });
    }}else if(body.type=="variation"){
        const dbObj=await setProductWebhookVariations(body)
         await InventoryData.findOneAndUpdate({variationID:body.id},{
        $set:dbObj,
      }).catch((err) => {
        //error, its handled now!
      });
    }
  

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "product updated",
      }),
      headers,
    };
  }else if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "product_remove_webhook"
  ) {
    let body = JSON.parse(event.body);
    console.log(body)
    await InventoryData.deleteMany({parentId:body.id}).catch((err) => {
      //error, its handled now!
    });

    await InventoryData.findOneAndDelete({id:body.id}).catch((err) => {
      //error, its handled now!
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "product removed",
      }),
      headers,
    };
  }else if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "product_create_webhook"
  ) {
    let body = JSON.parse(event.body);
    const check=await InventoryData.findOne({id:body.id}).catch((err) => {
      //error, its handled now!
    });
    //console.log(body)
    if(body.type=='simple' && !check){
      const data=await setSimpleProductWebhook(body)
      await jcsDataOp.save(data).catch((err) => {
        //error, its handled now!
      });
    } 
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "product created",
    }),
    headers,
  };
}
   else {
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
    if (event.httpMethod == "POST" && event.queryStringParameters.sku) {
      const inventoryInfo = await InventoryData.findOne({
        sku: event.queryStringParameters.sku,
        createdUser: decoded.id,
      });
      //console.log("1");

      if (!inventoryInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "No Products Found for given SKU!",
          }),
          headers,
        };
      }
      else if(inventoryInfo.id){
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "alredy added",
          }),
          headers,
        };
      }
      var data = mapData(inventoryInfo);
      var resp = "";

      await wooCommerce
        .postAsync("products", data)
        .then(async (response) => {
          console.log(JSON.parse(response.body));
          resp = JSON.parse(response.body);
          inventoryInfo["id"] = resp.id;

          try {
            await InventoryData.findOneAndUpdate(
              { sku: event.queryStringParameters.sku, createdUser: decoded.id },
              { $set: inventoryInfo }
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

    //update woocommerce data by sku
    if (event.httpMethod == "PUT" && event.queryStringParameters.sku) {
      const inventoryInfo = await InventoryData.findOne({
        sku: event.queryStringParameters.sku,
        createdUser: decoded.id,
      });
      //console.log("1");

      if (!inventoryInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "No Products Found for given SKU!",
          }),
          headers,
        };
      }

      await wooCommerce
        .putAsync("products/" + inventoryInfo.id, JSON.parse(event.body))
        .then(async (response) => {
          console.log(JSON.parse(response.body));
          resp = JSON.parse(response.body);
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

    //get woo commerce data
    if (event.httpMethod == "GET" && event.queryStringParameters.sku) {
      const inventoryInfo = await InventoryData.findOne({
        sku: event.queryStringParameters.sku,
        createdUser: decoded.id,
      });
      //console.log("1");

      if (!inventoryInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "No Products Found for given SKU!",
          }),
          headers,
        };
      }

      if (!inventoryInfo.id) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "no item found on woocommerce!",
          }),
          headers,
        };
      }

      await wooCommerce
        .getAsync("products/" + inventoryInfo.id)
        .then(async (response) => {
          console.log(JSON.parse(response.body));
          resp = JSON.parse(response.body);
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

    //create orders by item id
    if (
      event.httpMethod == "POST" &&
      event.queryStringParameters.item_id &&
      event.queryStringParameters.type == "order"
    ) {
      let body = JSON.parse(event.body);
      body["line_items"] = [
        {
          product_id: event.queryStringParameters.item_id,
          quantity: 1,
        },
      ];
      const inventoryInfo = await InventoryData.findOne({
        id: event.queryStringParameters.item_id,
        createdUser: decoded.id,
      });

      if (!inventoryInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "No Products Found for given ITEM ID ! ",
          }),
          headers,
        };
      }
      //console.log(inventoryInfo.salesHistory)
      var orderId = 0;
      await wooCommerce.postAsync("orders", body).then(async (response) => {
        //console.log(JSON.parse(response.body));
        var resp = JSON.parse(response.body);
        orderId = resp.id;
        var newHistory =
          inventoryInfo.orders.length > 0 ? inventoryInfo.orders : [];
        newHistory.push(resp);
        console.log(newHistory);

        await InventoryData.findOneAndUpdate(
          { id: event.queryStringParameters.item_id, createdUser: decoded.id },
          { $set: { orders: newHistory } }
        );
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `successfully ordered.order ID : ${orderId}`,
        }),
        headers,
      };
    }

    //get processing orders
    if (
      event.httpMethod == "GET" &&
      event.queryStringParameters.type == "order"
    ) {
      const inventoryOrder = await InventoryData.find(
        { createdUser: decoded.id },
        "orders"
      );

      var processingOrders = [];
      const allorders = await inventoryOrder.map((item) => {
        if (item.orders.length > 0) {
          for (var i = 0; i < item.orders.length; i++) {
            if (item.orders[i].status == "processing") {
              processingOrders.push(item.orders[i]);
            }
          }
        }
      });
      const finalResult = await Promise.all(allorders);

      return {
        statusCode: 200,
        body: JSON.stringify({ processing_Orders: processingOrders }),
        headers,
      };
    }

    //delete processing orders
    if (
      event.httpMethod == "DELETE" &&
      event.queryStringParameters.type == "order" &&
      event.queryStringParameters.order_id
    ) {
      const inventoryOrder = await InventoryData.find(
        { createdUser: decoded.id },
        "orders"
      );
      //console.log(inventoryOrder)
      var newOrderList = [];
      var dbId = "";
      const allorders = await inventoryOrder.map((item, index) => {
        if (item.orders.length > 0) {
          for (var i = 0; i < item.orders.length; i++) {
            if (item.orders[i].id == event.queryStringParameters.order_id) {
              dbId = item._id;
              newOrderList = item.orders;
              newOrderList.splice(i, 1);
              break;
            }
          }
        }
      });
      const finalResult = await Promise.all(allorders);

      await wooCommerce
        .deleteAsync(`orders/${event.queryStringParameters.order_id}`)
        .then(async (response) => {
          console.log(JSON.parse(response.body));

          await InventoryData.findOneAndUpdate(
            { _id: dbId, createdUser: decoded.id },
            { $set: { orders: newOrderList } }
          );
        });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "order removed successfully" }),
        headers,
      };
    }

    //update orders
    if (
      event.httpMethod == "PUT" &&
      event.queryStringParameters.type == "order" &&
      event.queryStringParameters.order_id
    ) {
      let body = JSON.parse(event.body);
      const inventoryOrder = await InventoryData.find(
        { createdUser: decoded.id },
        "orders"
      );
      var dbId = "";
      var newOrderList = [];
      const allorders = await inventoryOrder.map((item, index) => {
        if (item.orders.length > 0) {
          for (var i = 0; i < item.orders.length; i++) {
            if (item.orders[i].id == event.queryStringParameters.order_id) {
              dbId = item._id;
              newOrderList = item.orders;
              newOrderList.splice(i, 1);
              break;
            }
          }
        }
      });
      const finalResult = await Promise.all(allorders);
      var resp = "";
      await wooCommerce
        .putAsync(`orders/${event.queryStringParameters.order_id}`, body)
        .then(async (response) => {
          console.log(JSON.parse(response.body));
          resp = JSON.parse(response.body);
          newOrderList.push(resp);

          await InventoryData.findOneAndUpdate(
            { _id: dbId, createdUser: decoded.id },
            { $set: { orders: newOrderList } }
          );
        });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "order updated successfully",
          updated_Order: resp,
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
  }
};

const mapData = (item) => {
  const wooObj = {
    name: item.productName ? item.productName : "Premium Quality",
    sku: item.sku ? item.sku : "",
    stock_quantity:item.qty?`${item.qty}`:"",
    type: "simple",
    regular_price: item.retailPrice ? item.retailPrice : "0.00",
    description: item.longDescription
      ? item.longDescription
      : "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.",
    short_description: item.shortDescription
      ? item.shortDescription
      : "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    categories: [
      {
        id: 30,
      },
      {
        id: 14,
      },
    ],
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

const setSimpleProductWebhook=async (webHookItem)=>{

    const datamap = {
      id:webHookItem.id,
      productName: webHookItem.name,
      qty: webHookItem.stock_quantity,
      shortDescription: webHookItem.short_description,
      longDescription: webHookItem.description,
      cost: webHookItem.price ,
      sku:webHookItem.sku,
      retailPrice: webHookItem.regular_price,
      onSale: webHookItem.sale_price,
      productImages:
        webHookItem.images.length > 0 ? await mapImg(webHookItem.images) : [],
    }
    return datamap;
 }

 const setProductWebhookVariations=async(webHookItem)=>{
  const datamap = {
    qty: webHookItem.stock_quantity,
    sku:webHookItem.sku,
    cost: webHookItem.price,
    retailPrice: webHookItem.regular_price,
    onSale: webHookItem.sale_price,
    productImages:webHookItem.images?await mapImg(webHookItem.images):webHookItem.image != null?webHookItem.image:[],
    attributes:await webHookAtt(webHookItem.attributes),
    variationID:webHookItem.id,
  }
  return datamap;
 }

 const setParentProductWebhook=async (webHookItem)=>{

  const wooObj = {
    parentId:webHookItem.id,
    productName:webHookItem.name,
    longDescription:webHookItem.description,
    shortDescription:webHookItem.short_description,
  };
  return wooObj;
}
 
 const webHookAtt=async (item)=>{
   var obj={
    stoneClass : "",
    gemstoneType : "",
    stoneCut : "",
    stoneShape : "",
    stoneColor : "",
    stoneClarity : "",
    centerStoneCT : "",
    ctw : "",
    gender : "",
    metalType: "",
    metalColor : "",
    goldKarat : "",
    metalFinish : "",
    metalColorAvailability : "",
    ringSize : "",
    ringWidth : "",
    chainType : "",
    chainLength : "",
    chainWidth : "",
    hoopDiameter : "",
    pendantHeight : "",
    pendantWidth : "",
    prodWeight : ""
}
      if(item.length>0){
        await item.map((att)=>{
          obj[`${att.name}`]=att.option
        })

        console.log(obj)
      } 

      return obj
 }

 const mapImg = async (item) => {
  var img = []
     await item.map((i) => {
    img.push({ src: i.src })
  })

   return img
}