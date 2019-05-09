var admin = require('../util/firebaseadmin');

class UserService {
    constructor() {

    }

    registerNickname(userUid, newNickname) {

        var db = admin.firestore();
        var nickRef = db.collection('nicknames');
        var nickDocRef = nickRef.doc(newNickname);
        var userRef = db.collection('users').doc(userUid);

        return db.runTransaction((transaction) => {
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
                        transaction.update(userRef, {nickname: newNickname});
                        return Promise.resolve("Nickname " + newNickname + " registered");
                    })
                }
                else if (nickDoc.data().uid == userUid)
                    return Promise.reject('you have already registered this nickname');
                else 
                    return Promise.reject('nickname already taken');
            })
            .catch((error) => {
                console.log(error);
                return Promise.reject(error);
            })
        })


    }

}

module.exports = new UserService();