var admin = require('../util/firebaseadmin');

module.exports = isUserAuthenticated = (req,res,next) => {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(403).json({
            status: 403,
            message: 'FORBIDDEN'
        })
    }
	if (authHeaders) {
		var token = authHeaders.split(" ")[1];
        admin.auth().verifyIdToken(token)
        .then((decodedToken) => {
            var uid = decodedToken.uid;
            res.locals.auth = {
                uid
            }
            next();
        })
        .catch((error) => {
            console.error(error);
            return res.status(401).json({
                status: 401,
                message: 'UNAUTHORIZED'
            })
        });
    }
}