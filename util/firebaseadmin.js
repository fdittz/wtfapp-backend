var admin = require('firebase-admin');
const tunnel = require('tunnel2')
var serviceAccount = require('./serviceAccountKey.json');

const proxyAgent = tunnel.httpsOverHttp({
    proxy: {
      host: 'inet-sys.petrobras.com.br',
      port: 8080,
      proxyAuth: 'up2h:soludBr4' // Optional, required only if your proxy require authentication
    },
    "https-proxy": {
      host: 'inet-sys.petrobras.com.br',
      port: 804,
      proxyAuth: 'up2h:soludBr4' // Optional, required only if your proxy require authentication
    }
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  httpAgent: proxyAgent
});

module.exports = admin;