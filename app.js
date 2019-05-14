var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var users = require('./routes/users');
var public = require('./routes/public')
var quake = require('./routes/quake')

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.use('/api/public', public);
app.use('/api/users', users);
app.use('/api/quake', quake);


module.exports = app;
