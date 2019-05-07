var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

/* GET users listing. */
router.get('/new', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

router.get('/registernickname/:nickname', function(req, res, next) {
	var authHeaders = req.headers.authorization;
	var token = authHeaders.split(" ")[1];
	console.log(token)
	
	admin.auth().verifyIdToken(token).then(function(decodedToken) {
  				console.log(decodedToken);
  			});
	var db = admin.firestore();
  	db.collection('nicknames')
  	.doc(req.params.nickname)
  	.get()
  	.then((doc) => {
  		if (doc.exists) {
  			admin.auth().verifyToken(token).then(function(decodedToken) {
  				console.log(decodedToken);
  			})
  		}
  	})
  	
  

});
module.exports = router;
