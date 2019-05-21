var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")
var isUserAuthenticated  = require('../middleware/auth')

/* GET users listing. */
router.get('/list/:page?', function(req, res, next) {
  const PAGE_SIZE = 2;
  var page = req.params.page ? req.params.page : 1;
  return UserService.getUsersRef(PAGE_SIZE)
  .then((result) => {
	var firstUser = result.firstUsers[page-1];
	if (firstUser) {
		UserService.getUsers(firstUser,PAGE_SIZE).then(users => {
			res.json({pages: result.pages, users: users});
		});
	}
	else {
		res.json([]);
	}
	
  })
});

/* GET users listing. */
router.get('/new', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

router.get('/registerlogin/:login', isUserAuthenticated, function(req, res, next) {
	if (req.params.login.length < 4) {
		return res.status(400).json({
			status:400,
			message: 'login must be at least 4 characters long'
		});
	}
	return UserService.registerLogin(res.locals.auth.uid, req.params.login)
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
});

router.get('/:login', isUserAuthenticated, function(req, res, next) {
	if (req.params.login.length < 4) {
		return res.status(400).json({
			status:400,
			message: 'login must be at least 4 characters long'
		});
	}
	return UserService.getUserProfile(res.locals.auth.uid, req.params.login)
	.then((user) => {
		if (user)
			return res.status(200).json(user);
		else
			return res.status(404).json({
				status:404,
				message: "Player not found"
			})
	})
	.catch((err) => {
		console.error(err);
		return res.status(500).json({
			status: 500,
			message: "error"
		});
	});

});

module.exports = router;
