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
var servers = require('./routes/servers')
var matches = require('./routes/matches');
var morgan  = require('morgan')
const compress = require('compression');
var winston = require('./config/winston');
var serveStatic = require('serve-static')

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
app.use(compress())
app.use(morgan('combined', { stream: winston.stream }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.use('/api/public', public);
app.use('/api/users', users);
app.use('/api/quake', quake);
app.use('/api/servers', servers);
app.use('/api/matches', matches);

app.get('/demos', function(req, res) {
    res.redirect('http://tf.quadclub.com.br:27520/');
});
app.use(serveStatic(path.join(__dirname, 'public')))
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });


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

function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }
module.exports = app;
