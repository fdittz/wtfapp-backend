var admin = require('../util/firebaseadmin');

module.exports = {
    isAuthenticated: function (req, res, next) {
      var user = admin.auth().currentUser;
      if (user !== null) {
        req.user = user;
        next();
      } else {
        res.redirect('/login');
      }
    },
  }