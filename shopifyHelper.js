require('dotenv').config();
const util = require('./appUtil') ;
const superagent = require('superagent');
const dbHelper = require('./dbHelper');

const {API_VERSION} = process.env;

function getShopifyGraphqlEndpoint(shop)
{
   return `https://${shop}/admin/api/${API_VERSION}/graphql.json`;
}

async function registerFulfillmentService(shopDomain)
{
    const serviceName = "ShopifyEasyPostCustomIntegration";

    const gqlMutation =  `mutation {
        fulfillmentServiceCreate(name: "${serviceName}", trackingSupport: false) {
          userErrors {
            message
          }
          fulfillmentService {
            id
            location {
                id
              }
          }
        }
      }`;

    const accessToken = await util.getAccessTokenforDomain(shopDomain);

    const data = await superagent.post(getShopifyGraphqlEndpoint(shopDomain))
    .send(gqlMutation)
      .set('Content-Type', 'application/graphql')
      .set('X-Shopify-Access-Token', `${accessToken}`);

    if(data.body.data.fulfillmentServiceCreate.userErrors.length>0)
    {
        console.log("Error Registering Fulfillment service");
        //console.log(data.body.data.fulfillmentServiceCreate.userErrors);

    }else{

        console.log("Fulfillment Service installed");
        /*console.log(data.body.data.fulfillmentServiceCreate.fulfillmentService.location.id);
        console.log(data.body.data.fulfillmentServiceCreate.fulfillmentService.id);*/
        dbHelper.updateFulfillmentServiceDetailsForShop(shopDomain,data.body.data.fulfillmentServiceCreate.fulfillmentService.id,data.body.data.fulfillmentServiceCreate.fulfillmentService.location.id);

    }
}

async function createFulfillment(shopifyOrderId,shopDomain,trackers,lineItemsMarkedForFulfilment)
{
    const gqlMutation = `mutation fulfillmentCreate($input: FulfillmentInput!) {
        fulfillmentCreate(input: $input) {
          fulfillment {
            id
          }
          order {
            id
          }
          userErrors{
            message
          }
        }
      }`;

    let trackingNumbers = [];
    let trackingUrls = [];

    trackers.forEach(tracker => {
        trackingNumbers.push(tracker.tracking_code);
        trackingUrls.push(tracker.public_url)
    });

    const trackingCompany = trackers[0].carrier;

    const locationId = await dbHelper.getFulfillmentLocationIdForShop(shopDomain);

    const shopifyLineItems = lineItemsMarkedForFulfilment.map(lineItemId => {id : `gid://shopify/LineItem/${lineItemId}`});

    const variables = {
        "input": {
          "orderId": "gid://shopify/Order/"+shopifyOrderId,
          "locationId": locationId,
          "trackingNumbers" : trackingNumbers,
          "trackingUrls" : trackingUrls,
          "trackingCompany" : trackingCompany,
          "notifyCustomer" : true,
          "lineItems" :  shopifyLineItems
        }
      }

      const accessToken = await util.getAccessTokenforDomain(shopDomain);

      try{
      const data = await superagent.post(getShopifyGraphqlEndpoint(shopDomain)).
      send(JSON.stringify({
        query : gqlMutation,
        variables: variables
      }))
     .set('Content-Type', 'application/json')
     .set('X-Shopify-Access-Token', `${accessToken}`);

    // console.log("Data.body here");
    // console.log(data.body);
      if(data.body.data.fulfillmentCreate.userErrors.length>0)
      {
          console.log("Error creating Fulfillmrnt");
          console.log(data.body.data.fulfillmentCreate.userErrors);

      }else{

          console.log("Fulfillment created");
          console.log(data.body.data.fulfillmentCreate.fulfillment);

          const fulfillmentGid = data.body.data.fulfillmentCreate.fulfillment.id;
          console.log("fulfillmentGid::"+fulfillmentGid);

          //gid://shopify/Fulfillment/1084947628084
          const fulfillmentId = fulfillmentGid.substr("gid://shopify/Fulfillment/".length);

          await Promise.all([dbHelper.updateFulfillmentIdForShopifyOrder(shopifyOrderId,fulfillmentId),
            markFulfillmentComplete(shopifyOrderId,fulfillmentId,accessToken,shopDomain)]);


      }
    }catch (e)
    {
        console.log("Exception");
        console.log(e);
    }
}

/*orderId and fulfilmentId here are the ids and not the global ids  */
async function markFulfillmentOpen(orderId,fulfillmentId,accessToken,shopDomain)
{

    const postUrl = `https://${shopDomain}/admin/api/${API_VERSION}/orders/${orderId}/fulfillments/${fulfillmentId}/open.json`;
    try{
        const ret = await superagent.post(postUrl)
              .set('X-Shopify-Access-Token', `${accessToken}`);

        console.log("Fulfillment marked open");
    }catch(e)
    {
        console.log("Error marking fulfillment open");
        console.log(e);
    }

}

/*orderId and fulfilmentId here are the ids and not the global ids  */
async function markFulfillmentComplete(orderId,fulfillmentId,accessToken,shopDomain)
{

    const postUrl = `https://${shopDomain}/admin/api/${API_VERSION}/orders/${orderId}/fulfillments/${fulfillmentId}/complete.json`;
    try{
        const ret = await superagent.post(postUrl)
              .set('X-Shopify-Access-Token', `${accessToken}`);

        console.log("Fulfillment marked complete");
    }catch(e)
    {
        console.log("Error marking fulfillment complete");
        console.log(e);
    }

}

async function fetchVariantData(variantIds,shopDomain)
{

    const nodes = variantIds.map(varId => `"gid://shopify/ProductVariant/${varId}"`)
    
    const gqlQry = `{
        nodes(ids: [ ${nodes.join()}]) {
          ...on ProductVariant {
                        id
                        barcode
                        fulfillmentService {
                            id
                          }
                }
            }
       }`;
    console.log(gqlQry);

    const accessToken = await util.getAccessTokenforDomain(shopDomain);

    const data = await superagent.post(getShopifyGraphqlEndpoint(shopDomain))
    .send(gqlQry)
      .set('Content-Type', 'application/graphql')
      .set('X-Shopify-Access-Token', `${accessToken}`);


    return data.body.data.nodes;

}


module.exports = {
    registerFulfillmentService:registerFulfillmentService,
    createFulfillment:createFulfillment,
    markFulfillmentComplete:markFulfillmentComplete,
    fetchVariantData:fetchVariantData
}
