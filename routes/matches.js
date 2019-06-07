var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var MatchService = require("../services/MatchService")
var isUserAuthenticated  = require('../middleware/auth')
var isAdmin  = require('../middleware/admin')

const PAGE_SIZE = 10;

router.get('/', function(req, res, next) {
	return MatchService.getMatches()
	.then(function(data) {
		return res.status(200).json(data);
	})
	.catch(err => {
		return res.status(200).json([]);
	})
})

module.exports = router;