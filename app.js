var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var users = require('./routes/users');
var public = require('./routes/public')
var quake = require('./routes/quake')
var morgan  = require('morgan')

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.all('/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', { root: public });
});
app.use('/api/public', public);
app.use('/api/users', users);
app.use('/api/quake', quake);
app.use(express.static('public'));
app.use(morgan('combined'))
module.exports = app;
