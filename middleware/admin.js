var admin = require('../util/firebaseadmin');

module.exports = isAdmin = (req,res,next) => {
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
            var adminUid = decodedToken.uid;
            const userRef = admin.firestore().collection('users').doc(adminUid);
            userRef.get().then(result => {
                if (result.data().role == "admin" || result.data().role == "master")
                    next();
                else
                    return res.status(401).json({
                        status: 401,
                        message: 'UNAUTHORIZED'
                    })
            })
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