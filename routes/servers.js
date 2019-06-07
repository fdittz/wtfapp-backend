var express = require('express');
var router = express.Router();
var admin = require('../util/firebaseadmin');
var UserService = require("../services/UserService")
var isUserAuthenticated  = require('../middleware/auth')
var async = require('async')


/* GET users listing. */
router.get('/info/:addr/:port', function(req, res, next) {
    console.log("AA")
    const Gamedig = require('gamedig');
        Gamedig.query({
            type: 'quake1',
            host: req.params.addr,
            port: req.params.port
        }, {
            type: 'quake1',
            host: req.params.addr,
            port: 27502
        }).then((state) => {
            console.log(state);
            res.status(200).json(state)
        }).catch((error) => {
            console.log("Server is offline");
        });
});

router.get('/registered', function(req, res, next) {
    res.status(200).json([
        {address: "tf.quadclub.com.br", port: 27500},
        {address: "tf.quadclub.com.br", port: 27502},
        {address: "tf.quadclub.com.br", port: 27504},
        {address: "tf.quadclub.com.br", port: 27506},
        {address: "tf.quadclub.com.br", port: 27508},
        {address: "tf.quadclub.com.br", port: 27510},
        {address: "tf.quadclub.com.br", port: 27515},
        {address: "quaketf.club", port: 27500},
        {address: "quaketf.club", port: 27501}
    ])
});
module.exports = router;