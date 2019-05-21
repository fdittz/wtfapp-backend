var admin = require('../util/firebaseadmin');
var CryptoJS = require('crypto-js');

class UserService {

    constructor() {
        this.db = admin.firestore();
    }   

    registerLogin(userUid, newLogin) {
        var nickRef = this.db.collection('logins');
        var nickDocRef = nickRef.doc(newLogin);
        var userRef = this.db.collection('users').doc(userUid);

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
                firstUsers: []
            };
            if (result.docs.length > 0) { 
                for (var i = 0; i < result.docs.length; i = i + pageSize) {
                    if (result.docs[i])
                    response.firstUsers.push(result.docs[i]);
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
                    console.log("succ");
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