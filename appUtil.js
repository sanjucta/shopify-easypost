require('dotenv').config();
var pool = require('./database');   
const crypto = require('crypto');

function validateSignature(query) {
    var parameters = [];
    for (var key in query) {
      if (key != 'signature') {
        parameters.push(key + '=' + query[key])
      }
    }
    var message = parameters.sort().join('');
    var digest = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET_KEY).update(message).digest('hex');
    console.log("Digest is ::");
    console.log(digest);
    console.log("query.signature is ::");
    console.log(query.signature);


    return digest === query.signature;
  };

  async function getAccessTokenforDomain(shop_domain) {
    const queryResult = await pool.query(`select access_token from shop_tokens where shop_domain="${shop_domain}"`);
    const accessToken = queryResult[0].access_token;
    console.log("access_token::" + accessToken);
    return accessToken;
}

  module.exports = {
    validateSignature:validateSignature,
    getAccessTokenforDomain:getAccessTokenforDomain
  }


