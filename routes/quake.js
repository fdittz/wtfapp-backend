var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")
var isUserAuthenticated  = require('../middleware/auth')

/* GET users listing. */
router.post('/login', function(req, res, next) {
    UserService.login(req.body.login, req.body.secret).then(success => {
        return res.status(200).send(success.login + ";" + success.admin);
    }, error => {
        return res.status(403).send("Invalid login/pass");
    });
});
module.exports = router;