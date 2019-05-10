var admin = require('../util/firebaseadmin');

class UserService {

    constructor() {
        this.db = admin.firestore();
    }   

    registerNickname(userUid, newNickname) {
        var nickRef = this.db.collection('nicknames');
        var nickDocRef = nickRef.doc(newNickname);
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
                console.error(error);
                return Promise.reject(error);
            })
        })
        .catch(error => { console.error(error)})
    }

    getUserProfile(userUid, nickname) {
        var userRef = this.db.collection('users');
        return userRef.where("nickname", "==", nickname).get()
        .then(result => {
            if (result.docs.length) {
                var userFound = result.docs[0].data();
                if (userFound.uid == userUid) {
                   return userFound;
                }
                else
                    return {name: userFound.name, nickname: userFound.nickname}
            }
            
        });

    }
}

module.exports = new UserService();