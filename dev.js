const fs = require('fs');
const http = require('http');
const https = require('https');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');

var users = require('./routes/users');
var public = require('./routes/public')
var quake = require('./routes/quake')
var morgan  = require('morgan')
var serve = serveStatic('logs');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.use('/api/public', public);
app.use('/api/users', users);
app.use('/api/quake', quake);
app.use(express.static('dist'));
app.get('/demos', function(req, res) {
    res.redirect('http://tf.quadclub.com.br:27520/');
 });
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
app.use(morgan('combined'))

module.exports = app;
