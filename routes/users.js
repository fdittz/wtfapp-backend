var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")
var isUserAuthenticated  = require('../middleware/auth')
var isAdmin  = require('../middleware/admin')
var getUserData = require('../middleware/user')
var apicache = require('apicache');

let cache = apicache.middleware;




const PAGE_SIZE = 25;

//router.use(cache('5 minutes'));

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

router.get('/list/filter/:term?', function(req, res, next) {
	return UserService.getUsersFilter(req.params.term, PAGE_SIZE)
	.then((result) => {
		console.log(result)
		res.json(result);
	});

	
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
	if (req.body.login.length < 3) {
		return res.status(400).json({
			status:400,
			message: 'login must be at least 3 characters long'
		});
	}
	if (!req.body.login.match("[A-Za-z0-9_]+") || req.body.login.indexOf(" ") >= 0)
    {
        return res.status(400).json({
			status:400,
			message: "Invalid login"
		});
        return;
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

router.get('/:login', getUserData, function(req, res, next) {
	if (req.params.login.length < 3) {
		return res.status(400).json({
			status:400,
			message: 'login must be at least 3 characters long'
		});
	}
	let uid = res.locals.auth ? res.locals.auth.uid : "";
	return UserService.getUserProfile(uid, req.params.login)
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
			message: err
		});
	});

});

router.put('/admin/grant', isAdmin, isUserAuthenticated, function(req, res, next) {
	return UserService.grantAdmin(req.body.login,res.locals.auth.uid)
	.then((user) => {
		return res.status(200).json({admin: true});
	})
	.catch((err) => {
		console.error(err);
		return res.status(500).json({
			status: 500,
			message: err
		});
	});
});

router.put('/admin/revoke', isAdmin, isUserAuthenticated, function(req, res, next) {
	return UserService.revokeAdmin(req.body.login,res.locals.auth.uid)
	.then((user) => {
		return res.status(200).json({admin: true});
	})
	.catch((err) => {
		console.error(err);
		return res.status(500).json({
			status: 500,
			message: err
		});
	});
});

router.get('/profile/stats/:index/:login', function(req, res, next) {
	return UserService.getStats(req.params.login, req.params.index)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
})

router.get('/headtohead/:login1/:login2?', function(req, res, next) {
	return UserService.getHeadToHeadStats(req.params.login1, req.params.login2)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
});

router.get('/top/fraggers/:index', function(req, res, next) {
	return UserService.getTopFraggers(req.params.index)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
});

router.get('/top/damage/:index', function(req, res, next) {
	return UserService.getTopDamage(req.params.index)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
});

router.get('/top/goals/:index', function(req, res, next) {
	return UserService.getTopGoals(req.params.index)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
});

router.get('/top/fumbles/:index', function(req, res, next) {
	return UserService.getTopFumbles(req.params.index)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
});


router.get('/usr/ranks/:index', function(req, res, next) {
	return UserService.setRatings(req.params.index)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	 })
});

router.get('/usr/ranks/:index/:month', function(req, res, next) {
	return UserService.setRatings(req.params.index,req.params.month)
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	 })
});



module.exports = router;