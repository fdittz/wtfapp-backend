var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")
var isUserAuthenticated  = require('../middleware/auth')

const PAGE_SIZE = 10;

/* GET users listing. */
router.get('/list/:page?', function(req, res, next) {
  var page = req.params.page ? req.params.page : 1;
  return UserService.getUsersRef(PAGE_SIZE)
  .then((result) => {
	var firstUser = result.firstUsers[page-1];
	if (firstUser) {
		UserService.getUsers(firstUser,PAGE_SIZE).then(users => {
			res.json({pages: result.pages, numUsers: result.numUsers, users: users, firstUsers: result.firstUsers, perPage: PAGE_SIZE});
		});
	}
	else {
		res.status(404).json({pages: 0, numUsers: 0, users: [], firstUsers: [], perPage: PAGE_SIZE });
	}
	
  })
});

router.get('/list/fetch/:firstUser?', function(req, res, next) {
	  var firstUser = req.params.firstUser
	  if (firstUser) {
		  UserService.getUsers(firstUser,PAGE_SIZE).then(users => {
			  res.json({users: users, perPage: PAGE_SIZE});
		  });
	  }
	  else {
		  res.status(404).json({users: [], perPage: PAGE_SIZE});
	  }
	  
	
  });

/* GET users listing. */
router.post('/new', function(req, res, next) {
	return UserService.newUser(req.body)
	.then(
		(success) => {
			return res.status(200).json({
				success
			});
		}, 
		(error) => {
			return res.status(400).json({
				error
			});
		}
	);
});

router.post('/secret', isUserAuthenticated, function(req, res, next) {
	if (!req.body.secret) {
		return res.status(400).json({
			status:400,
			message: 'No secret'
		});
	}
	return UserService.updateSecret(res.locals.auth.uid, req.body.secret)
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

router.post('/registerlogin', isUserAuthenticated, function(req, res, next) {
	if (req.body.login.length < 4) {
		return res.status(400).json({
			status:400,
			message: 'login must be at least 4 characters long'
		});
	}
	return UserService.registerLogin(res.locals.auth.uid, req.body.login)
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
