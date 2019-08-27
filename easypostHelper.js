require('dotenv').config();
const util = require('./appUtil') ;
const superagent = require('superagent');
const dbHelper = require('./dbHelper');
const shopifyHelper = require('./shopifyHelper');


const easyPostCreateOrderEndPoint = 'https://api.easypost.com/fulfillment/vendor/v2/orders';

async function createEasyPostOrder(shopifyOrderInfo,shopDomain)
{
    console.log("In createEasyPostOrder");
    console.log(shopifyOrderInfo);
    const lineItems = shopifyOrderInfo.line_items;
    const variantIds = lineItems.map(item => item.variant_id);
    //console.log(lineItems);
    const variantData = await shopifyHelper.fetchVariantData(variantIds,shopDomain);
    console.log("Printing variantData");
    console.log(JSON.stringify(variantData));

    const easyPostOrderCreationRes = null;

    try{
        easyPostOrderCreationRes = await postOrderCreationRequestToEasyPost(shopifyOrderInfo,variantData,shopDomain);

        if(easyPostOrderCreationRes)
        {
            const { easypostOrder, itemsMarkedforFulfillment } = easyPostOrderCreationRes ;

            dbHelper.saveOrderMapping(easypostOrder.id,shopifyOrderInfo.id,"EASY_POST_ORDER_CREATED",shopDomain,itemsMarkedforFulfillment);
        }

    }catch(e)
    {
        console.log("Error creating EasyPost Order.Logging Error Status is database");
        dbHelper.saveOrderMapping(null,shopifyOrderInfo.id,"EASY_POST_ORDER_CREATION_ERR",shopDomain,null);       
    }
    
}



async function postOrderCreationRequestToEasyPost(shopifyOrderInfo,variantData,shopDomain)
{
    const fulfillmentServiceId = await dbHelper.getFulfillmentServiceIdForShop(shopDomain);
    const { easypostOrder, itemsMarkedforFulfillment } =  getOrderCreationRequestPayload(shopifyOrderInfo,variantData,fulfillmentServiceId);
    console.log(easypostOrder);

    if(easypostOrder.line_items.length>0)
    {
        const easypostOrderPayload = JSON.stringify(easypostOrder);

        let res = null;

        try{
            res = await superagent.post(easyPostCreateOrderEndPoint)
                .auth(process.env.EASYPOST_API_KEY, '')
                .set('Content-Type', 'application/json')
                .send(easypostOrderPayload);
        }catch(e)
        {
            console.log("Error Creating Easypost Order");
            console.log(e);
            throw (e);

        }
        console.log(res.body);
        return {
                easypostOrder : res.body,
                itemsMarkedforFulfillment: itemsMarkedforFulfillment
            };
    }else{
        console.log("Not creating EasyPost order as fulfillment service of none of the products in the order is marked as this app");
        return null;
    }
    //   console.log(res.body);
}

function getOrderCreationRequestPayload(shopifyOrderInfo,variantData,fulfillmentServiceId)
{
  const payLoad = {};

  payLoad.service = "standard"; //TO DO : read this from order
  payLoad.destination = {};
  payLoad.destination.name = shopifyOrderInfo.shipping_address.name;
  payLoad.destination.street1 = shopifyOrderInfo.shipping_address.address1;
  payLoad.destination.city = shopifyOrderInfo.shipping_address.city;
  payLoad.destination.state = shopifyOrderInfo.shipping_address.province_code;
  payLoad.destination.zip = shopifyOrderInfo.shipping_address.zip;
  payLoad.destination.country = shopifyOrderInfo.shipping_address.country;

  payLoad.line_items = [];
  lineItemsMarkedforFulfillment = [];

  shopifyOrderInfo.line_items.forEach(lineItem=>{

    variantItem = variantData.find(val => val.id == 'gid://shopify/ProductVariant/'+lineItem.variant_id);

    if (variantItem.fulfillmentService.id == fulfillmentServiceId) // create a fulfillment request for this line item only if the product variant has this fullfilment service chosen
    {
        payLoad.line_items.push({
            "product": {"barcode" : variantItem.barcode},
            "units": lineItem.quantity
        });
        lineItemsMarkedforFulfillment.push(lineItem.id);
        }

    })
   

  return {
    easypostOrder : payLoad,
    itemsMarkedforFulfillment : lineItemsMarkedforFulfillment
    };
}

async function processEasyPostWebhooks(payload)
{
    if ("fulfillment.order.updated" == payload.description)
    {
        createTrackingInfo(payload);
    }
    /*if(("tracker.updated" == payload.description) && ("delivered" == payload.result.status))
    {
        const trackerId = payload.result.id;
        await completeFulfillment(trackerId);
    }*/
}

/*async function completeFulfillment(trackerId)
{
    const {shopify_order_id, shopify_fulfillment_id, shop_domain} = await dbHelper.fetchShopifyFulfillmentDetailsforTrackerId(trackerId);

    const accessToken = await util.getAccessTokenforDomain(shop_domain);

    await shopifyHelper.markFulfillmentComplete(shopify_order_id,shopify_fulfillment_id,accessToken);

}*/

//Updates the tracking id in the database and creates an order fulfillment in Shopify
async function createTrackingInfo(payload)
{
    const easypostOrderId = payload.result.id;
    let trackers = payload.result.trackers;
    trackers.forEach(tracker => {
        dbHelper.insertTrackerInfo(easypostOrderId,tracker);
    });

    console.log(`Ep Order id here is ${easypostOrderId}`);

    const [ordIdandshpDomain, lnItms] = await Promise.all([dbHelper.getShopifyOrderIdAndShopDomain(easypostOrderId),
                                                          dbHelper.getLineItemsMarkedForFulfillment(easypostOrderId)]);

    console.log(`createTrackingInfo:::lnItms`);

    console.log(lnItms);

    shopifyHelper.createFulfillment(ordIdandshpDomain.shopifyOrderId,ordIdandshpDomain.shopDomain,trackers,lnItms);
    //createFulfilment
}


module.exports = {
    createEasyPostOrder: createEasyPostOrder,
    processEasyPostWebhooks:processEasyPostWebhooks
}
