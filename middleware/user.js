var admin = require('../util/firebaseadmin');

module.exports = getUserData = (req,res,next) => {
    const authHeaders = req.headers.authorization;
	if (authHeaders) {
		var token = authHeaders.split(" ")[1];
        admin.auth().verifyIdToken(token)
        .then((decodedToken) => {
            if (decodedToken) {
                var uid = decodedToken.uid;
                res.locals.auth = {
                    uid
                }
            }
            next();            
        }).catch((error) => {
            next();
        });
    }
    else {
        next();
    }
}