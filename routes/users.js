var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

/* GET users listing. */
router.get('/new', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
});

module.exports = router;
