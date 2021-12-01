console.log("STARTING")
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
var proc = require('process');
var access = fs.createWriteStream('logs/node.access.log', { flags: 'a' })
      , error = fs.createWriteStream( 'logs/node.error.log', { flags: 'a' });

// redirect stdout / stderr
//proc.stdout.pipe(access);
//proc.stderr.pipe(error);

// Certificate
/* const privateKey = fs.readFileSync('/etc/letsencrypt/live/www.qwtf.com.br/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/www.qwtf.com.br/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/www.qwtf.com.br/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};*/
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
    res.redirect('http://play.qwtf.com.br:27520/');
});

app.use (function (req, res, next) {
        if (req && req.headers && req.headers.host && req.headers.host.indexOf("www.qwtf.com.br") >= 0) {
                // request was via https, so do no special handling
                next();
        } else {
                // request was via http, so redirect to https
                res.redirect('https://www.qwtf.com.br' + req.url);
        }
});
app.use(serveStatic(path.join(__dirname, 'public')))
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });


// Starting both http & https servers
//const httpServer = http.createServer(function (req,res) {
  //  console.log(req.headers['host']);
    //res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    //res.end();
//}, app);
//const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app)

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');

});

//httpsServer.listen(443, () => {
//	console.log('HTTPS Server running on port 443');
//});

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
