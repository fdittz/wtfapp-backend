var admin = require('firebase-admin');
var serviceAccount = require('./serviceAccountKey.json');

var agent = new SocksProxyAgent(proxy);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;