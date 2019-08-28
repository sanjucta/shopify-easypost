require('dotenv').config();
var pool = require('./database');   


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


