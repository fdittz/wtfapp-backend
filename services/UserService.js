var admin = require('../util/firebaseadmin');
const playerQueries = require('../elasticsearch/playerqueries')
var esutil = require('../util/esutil');
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
            return this.db.collection('users').where("login", "==", login).get()
            .then(user => {
                if (user.docs[0].data().role == "master") 
                    return Promise.reject("Player is master")
                var userRef = this.db.collection('users').doc(user.docs[0].data().uid);
                return userRef.set({role: "admin", adminGivenBy: result.data().login}, { merge: true });
            });
        });
    }

    revokeAdmin(login,adminUid) {
        const selfRef = this.db.collection('users').doc(adminUid);
        return selfRef.get()
        .then(result => {
            if (result.data().role != "master") 
                return Promise.reject("Need to be master to revoke admin permissions");
            this.db.collection('users').where("login", "==", login).get()
            .then(user => {
                if (user.docs[0].data().role == "master") 
                    return Promise.reject("Player is master")
                var userRef = this.db.collection('users').doc(user.docs[0].data().uid);
                return userRef.update({role: admin.firestore.FieldValue.delete(), adminGivenBy: admin.firestore.FieldValue.delete()}, { merge: true });
            });
        });
    }

    registerLogin(userUid, newLogin) {
        newLogin = newLogin.toLowerCase();
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
                    return {name: userFound.name, login: userFound.login, role: userFound.role, adminGivenBy: userFound.adminGivenBy}
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
                    users.push({login: user.data().login, name: user.data().name, role: user.data().role, adminGivenBy: user.data().adminGivenBy});
                })
                return users;
            }
        });
    }

    getUsersFilter(term, offset) {
        var userRef = this.db.collection('users').orderBy("login").startAt(term).endAt(term+"\uf8ff").limit(offset);
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
        login = login.toLowerCase();
        var userRef = this.db.collection('users');
        return userRef.where("login", "==", login).get()
        .then(result => {
            if (result.docs.length) {
                var userFound = result.docs[0].data();
                var hmac = CryptoJS.HmacSHA512(secret,userFound.salt);
                var saltedHash = CryptoJS.enc.Base64.stringify(hmac);
                if (saltedHash == userFound.secret) {
                    return Promise.resolve({login: userFound.login, admin: (userFound.role == "admin" || userFound.role == "master")});
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

    getStats(login) {
        var matches = [];
        var stats = {
            matches: [],
            victories: 0,
            defeats: 0,
            draws: 0,
            numMatches: 0,
            winRate: "0%"
        }
        var query = playerQueries.getMatches(login);
        return esutil.sendQuery(query)
        .then(res => {
            if (!res.data.aggregations.unique_ids.buckets.length)
                return stats
            var resultMatches = res.data.aggregations.unique_ids.buckets;
            matches = resultMatches.map(match => {
                return match.key
            })            
            var query = playerQueries.getMatchesByPlayer(login,matches)
            return esutil.sendQuery(query)
            .then( result => {
                var games = result.data.aggregations.games.buckets;
                games = result.data.aggregations.games.buckets
                .filter( game => {
                    if (!game.gameInfo.map.buckets.length ||
                        !game.gameInfo.numPlayers.buckets.length ||
                        !game.gameInfo.numTeams.buckets.length ||
                        !game.result.winningTeam.buckets.length ||
                        !game.player.timePlayed.perTeam.buckets.length)
                        return false;
                    return true;
                })
                .map( game => {
                    var returnGame = {};
                    returnGame.startTime    = game.key.gameTimeStamp;
                    returnGame["map"]       = game.gameInfo.map.buckets[0].key;
                    if (game.gameInfo.demo.buckets.length)
                        returnGame.demo         = game.gameInfo.demo.buckets[0].key;
                    returnGame.numPlayers   = game.gameInfo.numPlayers.buckets[0].key;
                    returnGame.numTeams     = game.gameInfo.numTeams.buckets[0].key;
                    returnGame.player       = login;
                    returnGame.winningTeam  = game.result.winningTeam.buckets[0].key;
                    returnGame.playerTeam   = game.player.timePlayed.perTeam.buckets[0].key;
                    returnGame.result       = returnGame.winningTeam == 0 ? "draw" : (returnGame.winningTeam == returnGame.playerTeam ? "victory" : "defeat");
                    returnGame.teamMates    = []
                    returnGame.enemies      = []
                    for (var i = 0; i < game.players.buckets.length; i++) {
                        var player = game.players.buckets[i];
                        if (player.timePlayed.perTeam.buckets[0] && player.timePlayed.perTeam.buckets[0].key != "") {
                            if (player.timePlayed.perTeam.buckets[0].key == returnGame.playerTeam)
                                returnGame.teamMates.push(player.key);
                            else
                                returnGame.enemies.push(player.key);
                        }
                    }
                    return (returnGame);
                })
                var victories = 0;
                var defeats = 0;
                var draws = 0;
                games.forEach(game => {
                    if (game.result == "victory")
                        victories++;
                    else if (game.result == "defeat")
                        defeats++;
                    else
                        draws++;
                })
              
                stats.matches = games,
                stats.victories = victories,
                stats.defeats = defeats,
                stats.draws = draws,
                stats.numMatches = games.length,
                stats.winRate = Math.round((victories/games.length)* 100 * 100)/100 + "%"
                
                return stats;
            
            })
        })
        .then(stats => {
            var query = playerQueries.getTimePlayedByClassAndTeam(login);
            return esutil.sendQuery(query)
            .then(result => {
                stats.perTeam  = (result.data.aggregations.player.timePlayed.perTeam.buckets);
                stats.perClass = (result.data.aggregations.player.timePlayed.perClass.buckets); 
                stats.totalTime = (result.data.aggregations.player.timePlayed.total.value);
          
                return stats;
            });
        })
        .catch(err => {
            console.log(err)
            return Promise.reject();
        })
       
    }

    getOldStats(login) {
        var matches = [];
        var query = playerQueries.getMatches(login);
        return esutil.sendQuery(query)
        .then(res => {
            var resultMatches = res.data.aggregations.unique_ids.buckets;            
            return new Promise(function(resolve, reject) {                
                matches = resultMatches.map(match => {
                    query = playerQueries.getMatchDetails(login,match.key);
                    return esutil.sendQuery(query).then( match => {
                        return match.data.aggregations;
                    })
                })
                resolve(matches);
            })
           

        })
        .catch(err => {
            return Promise.reject();
        })
       
    }
}

module.exports = new UserService();