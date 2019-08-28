require('isomorphic-fetch');

const Koa = require('koa');
const session = require('koa-session');
const Router = require('koa-router');
const bodyParser = require('koa-body')();
const {default:shopifyAuth} = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const {receiveWebhook, registerWebhook} = require('@shopify/koa-shopify-webhooks');
require('dotenv').config();

const easypostHelper = require('./easypostHelper');
const dbHelper = require('./dbHelper');
const util = require('./appUtil') ;
const shopifyHelper = require('./shopifyHelper');


const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY,TUNNEL_URL } = process.env;

const webhook = receiveWebhook({secret: SHOPIFY_API_SECRET_KEY});

const server = new Koa();

server.keys = [SHOPIFY_API_SECRET_KEY]; 

server.use(session(server));    

server.use(
    shopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products','write_products','read_orders', 'write_orders','read_inventory', 'write_inventory','read_fulfillments', 'write_fulfillments'],
      async afterAuth(ctx) {

        const { shop, accessToken } = ctx.session;
           
        await dbHelper.saveAccessTokenForShop(shop, accessToken);

        const registration = await registerWebhook({
            address: `${TUNNEL_URL}/webhooks/order_created`,
            topic: 'ORDERS_CREATE',
            accessToken,
            shop,
          });
       
          if (registration.success) {
            console.log('Successfully registered webhook!');
                       
          } else {
            console.log('Failed to register webhook', registration.result);
          }
          // Register Fulfillment service 

          await shopifyHelper.registerFulfillmentService(shop);

        ctx.redirect('/');
      },
    }),
  );


const router = new Router();

router.get('/', ctx => {
      ctx.body = 'Nothing interesting Here!'
    });

      
router.post('/webhooks/order_created', webhook,  async (ctx,next) => {
        
        console.log("In order_created");
        console.log('received webhook: ', ctx.state.webhook);
      //  console.log(ctx.request.body);

        const shop_domain = ctx.state.webhook.domain;
        console.log(`shop_domain is ${shop_domain}`);

        const prom = easypostHelper.createEasyPostOrder(ctx.request.body,shop_domain);
        ctx.status = 200;
        ctx.body = "";
             
      })      

router.post('/process_easypost_webhook', bodyParser,  async (ctx,next) => {
        
        console.log("******In process_easypost_webhook*****************");
        
        const payload = ctx.request.body;

        //logPayload(payload);
    
        easypostHelper.processEasyPostWebhooks(payload);

        ctx.status = 200;
        ctx.body = "";
             
      })      
     

router.get('*', verifyRequest(), async (ctx) => {
        
    });

server.use(router.allowedMethods());         
server.use(router.routes())

server.listen(3000, ()=>{console.log("Server Started")});


function logPayload(payload) {
    console.log("payload description::" + payload.description);
    console.log("payload.result.id::" + payload.result.id);
    console.log("payload.result.object::" + payload.result.object);
    console.log("payload.result.status::" + payload.result.status);
    console.log("payload.result.line_items---");
    console.log(payload.result.line_items);
    console.log("payload.result.shipment_options---");
    console.log(payload.result.shipment_options);
    console.log("payload.result.trackers---");
    console.log(payload.result.trackers);
    console.log("payload.result.returns---");
    console.log(payload.result.returns);
    console.log("payload.result.picks---");
    console.log(payload.result.picks);
    console.log("payload.status::" + payload.status);
    console.log("payload.result.tracking_details---");
    console.log(payload.result.tracking_details);
    console.log("***********************************************");
}
