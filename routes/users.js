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
	if (req.params.nickname.length < 4) {
		return res.status(400).json({
			status:400,
			message: 'nickname must be at least 4 characters long'
		});
	}
	var authHeaders = req.headers.authorization;
	var token = authHeaders.split(" ")[1];
	console.log("TESTY");

	
	return admin.auth().verifyIdToken(token).then(function(decodedToken) {
		var db = admin.firestore();
	  	return db.collection('nicknames')
	  	.doc(req.params.nickname)
	  	.get()
	  	.then((doc) => {
	  		console.log("DOCCY");
	  		if (!doc.exists) {
	  			db.collection('nicknames')
	  			.doc(req.params.nickname)
	  			.set({uid: decodedToken.uid}, {merge: true});
	  			return res.status(200).json({
					status:200,
					message: 'nickname registered'
				});
	  		}
	  		else if (doc.data().uid == decodedToken.uid) {
	  			return res.status(400).json({
					status:400,
					message: 'you already registered this nickname'
				});
	  		}
	  		else {
	  			return res.status(400).json({
					status:400,
					message: 'nickname already registered'
				});
	  		}
	  	})

	});
  	
  

});
module.exports = router;
