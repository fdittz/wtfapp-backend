const fs = require('fs');
const http = require('http');
const https = require('https');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var users = require('./routes/users');
var public = require('./routes/public')
var quake = require('./routes/quake')
var morgan  = require('morgan')

var app = express();

// Certificate
const privateKey = fs.readFileSync('/home/qw/archive/tf.quadclub.com.br/privkey1.pem', 'utf8');
const certificate = fs.readFileSync('/home/qw/archive/tf.quadclub.com.br/cert1.pem', 'utf8');
const ca = fs.readFileSync('/home/qw/archive/tf.quadclub.com.br/chain1.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.use('/api/public', public);
app.use('/api/users', users);
app.use('/api/quake', quake);
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
app.use(morgan('combined'))

// Starting both http & https servers
const httpServer = http.createServer(function (req,res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
});
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');

});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

module.exports = app;
