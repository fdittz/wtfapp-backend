var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

/* GET users listing. */
router.get('/new', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

router.get('/registernickname/:nickname', function(req, res, next) {
	if (req.params.nickname.length < 4) {
		return res.status(400).json({
			status:400,
			message: 'nickname must be at least 4 characters long'
		});
	}
	var authHeaders = req.headers.authorization;
	if (authHeaders) {
		var token = authHeaders.split(" ")[1];
		return admin.auth().verifyIdToken(token).then(function(decodedToken) {
			return UserService.registerNickname(decodedToken.uid, req.params.nickname)
			.then(
				(success) => {
					return res.status(200).json({
						status:200,
						message: success
					});
				}, 
				(error) => {
					return res.status(400).json({
						status:400,
						message: error
					});
				}
			);
		})
	}
	else {
		return res.status(401).json({
			status:401,
			message: 'Unauthorized'
		});
	}
  	
  

});
module.exports = router;
