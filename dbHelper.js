require('dotenv').config();
const pool = require('./database');

async function saveOrderMapping(easyPostOrderId,shopifyOrderId,status,shopDomain,itemsMarkedforFulfillment)
{
    itemsMarkedforFulfillment = itemsMarkedforFulfillment ? itemsMarkedforFulfillment.join(',') : null ;
    return pool.query(`insert into order_fulfillment(shopify_order_id,easypost_order_id, line_items_marked_for_fulfillment,status,shop_domain) values("${shopifyOrderId}","${easyPostOrderId}","${itemsMarkedforFulfillment}","${status}","${shopDomain}")`);
}

async function insertTrackerInfo(easyPostOrderId,tracker)
{
    return pool.query(`insert into order_tracking_details(easypost_order_id,easypost_tracker_id,tracking_code,tracking_url,carrier) 
                       values("${easyPostOrderId}","${tracker.id}","${tracker.tracking_code}","${tracker.public_url}","${tracker.carrier}")`);
}

async function getShopifyOrderIdAndShopDomain(easyPostOrderId)
{    
    const result =  await pool.query(`select shopify_order_id,shop_domain from order_fulfillment where easypost_order_id = "${easyPostOrderId}"` );
    const retVal =  (result && result[0])?{
        shopifyOrderId : result[0].shopify_order_id,
        shopDomain : result[0].shop_domain
    }:null;
    return retVal;
}

async function updateFulfillmentServiceDetailsForShop(shopDomain,fulfillmentServiceId,fulfillmentServiceLocationId)
{
    const updateResult = await pool.query(`update shop_tokens set fulfillment_service_id = "${fulfillmentServiceId}" , fulfillment_service_location_id = "${fulfillmentServiceLocationId}"   where shop_domain="${shopDomain}"`);
    
    return updateResult;
}

async function getFulfillmentLocationIdForShop(shopDomain)
{
    const result = await pool.query(`select fulfillment_service_location_id from shop_tokens where shop_domain="${shopDomain}"`);
    
    const locationId = result && result[0]?result[0].fulfillment_service_location_id:null;

    return locationId;
}


async function getFulfillmentServiceIdForShop(shopDomain)
{
    const result = await pool.query(`select fulfillment_service_id from shop_tokens where shop_domain="${shopDomain}"`);
    
    const fulfillmentServiceId = result && result[0]?result[0].fulfillment_service_id:null;

    return fulfillmentServiceId;
}

async function getLineItemsMarkedForFulfillment(easyPostOrderId)
{
    const result = await pool.query(`select line_items_marked_for_fulfillment from order_fulfillment where easypost_order_id="${easyPostOrderId}"`);
    
    const lineItems = result && result[0]?result[0].line_items_marked_for_fulfillment.split(","):[];

    return lineItems;
}

async function updateFulfillmentIdForShopifyOrder(shopifyOrderId,fulfillmentId)
{
    
    const updateResult = await pool.query(`update order_fulfillment set shopify_fulfillment_id = "${fulfillmentId}"  where shopify_order_id="${shopifyOrderId}"`);
    
    return updateResult;
}

async function fetchShopifyFulfillmentDetailsforTrackerId(trackerId)
{
    const result = await pool.query(`select shopify_order_id, shopify_fulfillment_id, shop_domain from order_fulfillment of, order_tracking_details otd  where otd.easypost_tracker_id="${trackerId}" and otd.easypost_order_id = of.easypost_order_id`);
    
    const retVal = result && result[0]?{
        shopify_order_id : result[0].shopify_order_id,
        shopify_fulfillment_id : result[0].shopify_fulfillment_id,
        shop_domain: result[0].shop_domain

    }:null;

    return retVal;
}

async function saveAccessTokenForShop(shop, accessToken) {
    const queryResult = await pool.query(`select access_token from shop_tokens where shop_domain="${shop}"`);
    if (queryResult.length > 0) {
        await pool.query(`delete from shop_tokens where shop_domain="${shop}"`);
    }
    await pool.query(`insert into shop_tokens(shop_domain,access_token) values("${shop}","${accessToken}")`);
}

module.exports = {
    saveOrderMapping:saveOrderMapping,
    insertTrackerInfo:insertTrackerInfo,
    getShopifyOrderIdAndShopDomain:getShopifyOrderIdAndShopDomain,
    updateFulfillmentServiceDetailsForShop:updateFulfillmentServiceDetailsForShop,
    getFulfillmentLocationIdForShop:getFulfillmentLocationIdForShop,
    getLineItemsMarkedForFulfillment:getLineItemsMarkedForFulfillment,
    getFulfillmentServiceIdForShop:getFulfillmentServiceIdForShop,
    updateFulfillmentIdForShopifyOrder:updateFulfillmentIdForShopifyOrder,
    fetchShopifyFulfillmentDetailsforTrackerId:fetchShopifyFulfillmentDetailsforTrackerId,
    saveAccessTokenForShop:saveAccessTokenForShop
    
}