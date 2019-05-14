var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")
var isUserAuthenticated  = require('../middleware/auth')

/* GET users listing. */
router.post('/login', function(req, res, next) {
    UserService.login(req.body.nickname, req.body.secret).then(success => {
        console.log(success);
        return res.status(200).json({
			status: 200,
			message: "error"
		});
    }, error => {
        return res.status(403).json({
			status: 403,
			message: "invalid login/pass"
		});
    });
});
module.exports = router;