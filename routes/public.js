var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');

/* GET users listing. */
router.get('/user/list', function(req, res, next) {
  var db = admin.firestore();
  var cityRef = db.collection('users');
  var query = cityRef.get()
    .then(snapshot => {
      var users =[];
      snapshot.forEach(doc => {
        if (doc.data().name)
          users.push( {
            name: doc.data().name,
            login: doc.data().login,
            photoURL: doc.data().photoURL
          });

      });
      res.json(users);
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
});

module.exports = router;
