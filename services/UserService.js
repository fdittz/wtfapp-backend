var admin = require('../util/firebaseadmin');
var CryptoJS = require('crypto-js');

class UserService {

    constructor() {
        this.db = admin.firestore();
    }   

    newUser(data) {
        const userRef = this.db.collection('users').doc(data.uid);
		return userRef.set(data, { merge: true }) 
    }

    updateSecret(userUid, newSecret) {
        const userRef = this.db.collection('users').doc(userUid);
        var salt = CryptoJS.lib.WordArray.random(16).toString().slice(0,16);
        var hmac = CryptoJS.HmacSHA512(newSecret, salt);
        var saltedHash = CryptoJS.enc.Base64.stringify(hmac);
        const newData = {
            uid: userUid,
            secret: saltedHash,
            salt: salt
        }
        return userRef.set(newData, { merge: true });;
    }

    grantAdmin(login,adminUid) {
        const selfRef = this.db.collection('users').doc(adminUid);
        return selfRef.get()
        .then(result => {
            if (result.data().admin) {
                this.db.collection('users').where("login", "==", login)
                .then(result => {
                    var userRef = result.docs[0];
                    return userRef.set({admin: true, adminGivenBy: result.data().login}, { merge: true });
                });
            }
        });
    }

    revokeAdmin(login,adminUid) {
        const selfRef = this.db.collection('users').doc(adminUid);
        return selfRef.get()
        .then(result => {
            if (result.data().admin) {
                this.db.collection('users').where("login", "==", login)
                .then(result => {
                    var userRef = result.docs[0];
                    return userRef.update({admin: FirebaseFirestore.FieldValue.delete(), adminGivenBy: FirebaseFirestore.FieldValue.delete()}, { merge: true });
                });
            }
        });
    }

    registerLogin(userUid, newLogin) {
        var nickRef = this.db.collection('logins');
        var nickDocRef = nickRef.doc(newLogin);
        var userRef = this.db.collection('users').doc(userUid);

        return userRef.get()
        .then(result => {
            if (result.data().login)
                return Promise.reject("Login already defined")
            return this.db.runTransaction((transaction) => {
                return transaction.get(nickDocRef).then((nickDoc) => {
                    if (!nickDoc.exists) {
                        return nickRef.where("uid", "==", userUid).get()
                        .then(result => {
                            result.forEach(nickFound => {
                                transaction.delete(nickFound.ref);
                            })
                        })
                        .then(_ => {
                            transaction.set(nickDocRef, {uid: userUid}, {merge: true});
                        })
                        .then(_ => {
                            transaction.update(userRef, {login: newLogin});
                            return Promise.resolve("Login " + newLogin + " registered");
                        })
                    }
                    else if (nickDoc.data().uid == userUid)
                        return Promise.reject('you have already registered this login');
                    else 
                        return Promise.reject('login already taken');
                })
                .catch((error) => {
                    console.error(error);
                    return Promise.reject(error);
                })
            })
            .catch(error => { console.error(error)})
        });
    }

    getUserProfile(userUid, login) {
        var userRef = this.db.collection('users');
        return userRef.where("login", "==", login).get()
        .then(result => {
            if (result.docs.length) {
                var userFound = result.docs[0].data();
                if (userFound.uid == userUid) {
                   return userFound;
                }
                else
                    return {name: userFound.name, login: userFound.login}
            }
            
        });
    }

    getUsersRef(pageSize) {
        var userRef = this.db.collection('users').where("login",">","").orderBy("login");
        return userRef.get()
        .then(result => {
            var response = {
                pages: Math.floor(result.docs.length/pageSize) + 1,
                numUsers: result.docs.length,
                firstUsers: []
            };
            if (result.docs.length > 0) { 
                for (var i = 0; i < result.docs.length; i = i + pageSize) {
                    if (result.docs[i])
                    response.firstUsers.push(result.docs[i].data().login);
                }
            }
            return response;
        })
    }
    
    getUsers(startUser,offset) {
        var userRef = this.db.collection('users').where("login",">","").orderBy("login").startAt(startUser).limit(offset);
        return userRef.get()
        .then(result => {
            if (result.docs.length) {
                var users = [];
                result.docs.forEach(user => {
                    users.push({login: user.data().login, name: user.data().name});
                })
                return users;
            }
        });
    }

    login(login, secret) {
        var userRef = this.db.collection('users');
        return userRef.where("login", "==", login).get()
        .then(result => {
            if (result.docs.length) {
                var userFound = result.docs[0].data();
                var hmac = CryptoJS.HmacSHA512(secret,userFound.salt);
                var saltedHash = CryptoJS.enc.Base64.stringify(hmac);
                if (saltedHash == userFound.secret) {
                    return Promise.resolve("success");
                }
                else {
                    console.log("err pass: " + login);
                    return Promise.reject("invalid login/pass");
                }
            }
            else {
                console.log("err notfound: " + login);
                return Promise.reject("invalid login/pass");
            }            
        });
    }
}

module.exports = new UserService();