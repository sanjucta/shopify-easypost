# shopify-easypost
A Shopify App written in Node.js to integrate Shopify with the easypost fulfillment service.

To run the app , you will need to create a new Shopify app in your Shopify partner dashboard and add the following to the
list of Whitelisted redirection URL(s).

https://<your_application_host>/auth/callback

If you want to run the app on your local machine you will need to expose a port on your local machine to the internet using something like
ngrok and replace <your_application_host> in the url above with the public url of the tunnel.

Rename the .env.template file to .env and add appropriate values for the environment variables.
To start the app use node server.js at the command prompt.

To install the app to a store, type the following url in the browser.

https://<your_application_host>/auth?shop=<yourshopname>

