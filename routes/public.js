var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');

/* GET users listing. */
router.get('/user/:id', function(req, res, next) {
	console.log(req.params.id);
  res.json({users: [{name: 'Timssmy'}]});
  var db = admin.firestore();
  var cityRef = db.collection('users');
  var query = cityRef.get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        console.log(doc.data());
      });
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
/*  var ref = db.ref("users/lw2CWvaixJZrjg89Sb6osvzFsyS2");
  console.log("ARGH")
		ref.on("value", function(snapshot) {
		  console.log(snapshot.val());
		});*/
  //console.log(admin)
});

module.exports = router;
