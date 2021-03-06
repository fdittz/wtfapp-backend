var admin = require("../util/firebaseadmin");
const playerQueries = require("../elasticsearch/playerqueries");
const matchQueries = require("../elasticsearch/matchqueries");
var esutil = require("../util/esutil");
var CryptoJS = require("crypto-js");
var trueskill = require("ts-trueskill");
var moment = require("moment-timezone");
const logger = require("../config/winston");
var env = new trueskill.TrueSkill();

class UserService {
  constructor() {
    this.db = admin.firestore();
  }

  newUser(data) {
    const userRef = this.db.collection("users").doc(data.uid);
    return userRef.set(data, { merge: true });
  }

  updateSecret(userUid, newSecret) {
    const userRef = this.db.collection("users").doc(userUid);
    var salt = CryptoJS.lib.WordArray.random(16).toString().slice(0, 16);
    var hmac = CryptoJS.HmacSHA512(newSecret, salt);
    var saltedHash = CryptoJS.enc.Base64.stringify(hmac);
    const newData = {
      uid: userUid,
      secret: saltedHash,
      salt: salt,
    };
    return userRef.set(newData, { merge: true });
  }

  grantAdmin(login, adminUid) {
    const selfRef = this.db.collection("users").doc(adminUid);
    return selfRef.get().then((result) => {
      return this.db
        .collection("users")
        .where("login", "==", login)
        .get()
        .then((user) => {
          if (user.docs[0].data().role == "master")
            return Promise.reject("Player is master");
          var userRef = this.db
            .collection("users")
            .doc(user.docs[0].data().uid);
          return userRef.set(
            { role: "admin", adminGivenBy: result.data().login },
            { merge: true }
          );
        });
    });
  }

  revokeAdmin(login, adminUid) {
    const selfRef = this.db.collection("users").doc(adminUid);
    return selfRef.get().then((result) => {
      if (result.data().role != "master")
        return Promise.reject("Need to be master to revoke admin permissions");
      this.db
        .collection("users")
        .where("login", "==", login)
        .get()
        .then((user) => {
          if (user.docs[0].data().role == "master")
            return Promise.reject("Player is master");
          var userRef = this.db
            .collection("users")
            .doc(user.docs[0].data().uid);
          return userRef.update(
            {
              role: admin.firestore.FieldValue.delete(),
              adminGivenBy: admin.firestore.FieldValue.delete(),
            },
            { merge: true }
          );
        });
    });
  }

  registerLogin(userUid, newLogin) {
    newLogin = newLogin.toLowerCase();
    var nickRef = this.db.collection("logins");
    var nickDocRef = nickRef.doc(newLogin);
    var userRef = this.db.collection("users").doc(userUid);

    return userRef.get().then((result) => {
      if (result.data().login) return Promise.reject("Login already defined");
      return this.db
        .runTransaction((transaction) => {
          return transaction
            .get(nickDocRef)
            .then((nickDoc) => {
              if (!nickDoc.exists) {
                return nickRef
                  .where("uid", "==", userUid)
                  .get()
                  .then((result) => {
                    result.forEach((nickFound) => {
                      transaction.delete(nickFound.ref);
                    });
                  })
                  .then((_) => {
                    transaction.set(
                      nickDocRef,
                      { uid: userUid },
                      { merge: true }
                    );
                  })
                  .then((_) => {
                    transaction.update(userRef, { login: newLogin });
                    return Promise.resolve("Login " + newLogin + " registered");
                  });
              } else if (nickDoc.data().uid == userUid)
                return Promise.reject("you have already registered this login");
              else return Promise.reject("login already taken");
            })
            .catch((error) => {
              console.error(error);
              return Promise.reject(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  getUserProfile(userUid, login) {
    var userRef = this.db.collection("users");
    return userRef
      .where("login", "==", login)
      .get()
      .then((result) => {
        if (result.docs.length) {
          var userFound = result.docs[0].data();
          if (userFound.uid == userUid) {
            return userFound;
          } else
            return {
              name: userFound.name,
              login: userFound.login,
              role: userFound.role,
              adminGivenBy: userFound.adminGivenBy,
            };
        }
      });
  }

  getUsersRef(pageSize) {
    var userRef = this.db
      .collection("users")
      .where("login", ">", "")
      .orderBy("login");
    return userRef.get().then((result) => {
      var response = {
        pages: Math.floor(result.docs.length / pageSize) + 1,
        numUsers: result.docs.length,
        firstUsers: [],
      };
      if (result.docs.length > 0) {
        for (var i = 0; i < result.docs.length; i = i + pageSize) {
          if (result.docs[i])
            response.firstUsers.push(result.docs[i].data().login);
        }
      }
      return response;
    });
  }

  getUsers(startUser, offset) {
    var userRef = this.db
      .collection("users")
      .where("login", ">", "")
      .orderBy("login")
      .startAt(startUser)
      .limit(offset);
    return userRef.get().then((result) => {
      if (result.docs.length) {
        var users = [];
        result.docs.forEach((user) => {
          users.push({
            login: user.data().login,
            name: user.data().name,
            role: user.data().role,
            adminGivenBy: user.data().adminGivenBy,
          });
        });
        return users;
      }
    });
  }

  getUsersFilter(term, offset) {
    var userRef = this.db
      .collection("users")
      .orderBy("login")
      .startAt(term)
      .endAt(term + "\uf8ff")
      .limit(offset);
    return userRef.get().then((result) => {
      if (result.docs.length) {
        var users = [];
        result.docs.forEach((user) => {
          users.push({ login: user.data().login, name: user.data().name });
        });
        return users;
      }
    });
  }

  login(login, secret) {
    login = login.toLowerCase();
    var userRef = this.db.collection("users");
    return userRef
      .where("login", "==", login)
      .get()
      .then((result) => {
        if (result.docs.length) {
          var userFound = result.docs[0].data();
          var hmac = CryptoJS.HmacSHA512(secret, userFound.salt);
          var saltedHash = CryptoJS.enc.Base64.stringify(hmac);
          if (saltedHash == userFound.secret) {
            return Promise.resolve({
              login: userFound.login,
              admin: userFound.role == "admin" || userFound.role == "master",
            });
          } else {
            console.log("err pass: " + login);
            return Promise.reject("invalid login/pass");
          }
        } else {
          console.log("err notfound: " + login);
          return Promise.reject("invalid login/pass");
        }
      });
  }

  formatMatch(match) {
    var returnGame = {};
    returnGame.startTime = match.key.gameTimeStamp;
    returnGame["map"] = match.gameInfo.map.buckets[0].key;
    if (match.gameInfo.demo.buckets.length)
      returnGame.demo = match.gameInfo.demo.buckets[0].key;
    returnGame.numPlayers = match.gameInfo.numPlayers.buckets[0].key;
    returnGame.numTeams = match.gameInfo.numTeams.buckets[0].key;
    returnGame.winningTeam = match.result.scores.value[0].winningTeam;
    returnGame.playerTeam = match.player.timePlayed.perTeam.buckets[0].key;
    returnGame.result =
      returnGame.winningTeam == 0
        ? "draw"
        : returnGame.winningTeam == returnGame.playerTeam
          ? "victory"
          : "defeat";
    returnGame.teamMates = [];
    returnGame.enemies = [];
    for (var i = 0; i < match.players.timePlayed.value.length; i++) {
      var player = match.players.timePlayed.value[i];
      player.byTeam = player.byTeam.sort(function (a, b) {
        return b[Object.keys(b)] - a[Object.keys(a)];
      });
      var playerTeam = Object.keys(player.byTeam[0])[0];
      if (playerTeam && playerTeam != "") {
        if (playerTeam == returnGame.playerTeam)
          returnGame.teamMates.push(player.login);
        else returnGame.enemies.push(player.login);
      }
    }
    return returnGame;
  }
  getStats(login) {
    var matches = [];
    var stats = {
      matches: [],
      victories: 0,
      defeats: 0,
      draws: 0,
      numMatches: 0,
      winRate: "0%",
    };
    var query = playerQueries.getMatches(login);
    return esutil
      .sendQuery(query)
      .then((res) => {
        if (!res.data.aggregations.unique_ids.buckets.length) return stats;
        var resultMatches = res.data.aggregations.unique_ids.buckets;

        matches = resultMatches.map((match) => {
          return match.key;
        });
        var query = playerQueries.getMatchesByPlayer(login, matches);
        return esutil.sendQuery(query).then((result) => {
          var games = result.data.aggregations.games.buckets;
          games = result.data.aggregations.games.buckets
            .filter((game) => {
              if (
                !game.gameInfo.map.buckets.length ||
                !game.gameInfo.numPlayers.buckets.length ||
                !game.gameInfo.numTeams.buckets.length ||
                !(game.result.scores.value[0].winningTeam >= 0) ||
                !game.player.timePlayed.perTeam.buckets.length
              )
                return false;
              return true;
            })
            .map((match) => {
              return this.formatMatch(match, login);
            });
          var victories = 0;
          var defeats = 0;
          var draws = 0;
          games.forEach((game) => {
            if (game.result == "victory") victories++;
            else if (game.result == "defeat") defeats++;
            else draws++;
          });

          (stats.matches = games),
            (stats.victories = victories),
            (stats.defeats = defeats),
            (stats.draws = draws),
            (stats.numMatches = games.length),
            (stats.winRate =
              Math.round((victories / games.length) * 100 * 100) / 100 + "%");

          return stats;
        });
      })
      .then((stats) => {
        var query = playerQueries.getTimePlayedByClassAndTeam(login);
        return esutil.sendQuery(query).then((result) => {
          stats.perTeam =
            result.data.aggregations.player.timePlayed.perTeam.buckets;
          stats.perClass = result.data.aggregations.player.perClass.buckets;
          stats.totalTime =
            result.data.aggregations.player.timePlayed.total.value;
          stats.perClass = result.data.aggregations.player.perClass.buckets.map(
            (classStats) => {
              var weaponStats = classStats.kills.enemy.perWeapon.buckets.map(
                (weapon) => {
                  return { key: weapon.key, frags: weapon.doc_count };
                }
              );
              return {
                key: classStats.key,
                frags: classStats.kills.enemy.doc_count,
                fragsByWeapon: weaponStats,
                damageDone: classStats.damageDone.enemy.damage.value,
                teamKills: classStats.kills.team.doc_count,
                teamDamage: classStats.damageDone.team.damage.value,
                deaths: classStats.deaths.enemy.doc_count,
                damageTaken: classStats.damageTaken.enemy.damage.value,
                teamDeaths: classStats.deaths.team.doc_count,
                teamDamageTaken: classStats.damageTaken.team.damage.value,
                timePlayed: classStats.timePlayed.total.value,
              };
            }
          );
          return stats;
        });
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject();
      });
  }

  getOldStats(login) {
    var matches = [];
    var query = playerQueries.getMatches(login);
    return esutil
      .sendQuery(query)
      .then((res) => {
        var resultMatches = res.data.aggregations.unique_ids.buckets;
        return new Promise(function (resolve, reject) {
          matches = resultMatches.map((match) => {
            query = playerQueries.getMatchDetails(login, match.key);
            return esutil.sendQuery(query).then((match) => {
              return match.data.aggregations;
            });
          });
          resolve(matches);
        });
      })
      .catch((err) => {
        return Promise.reject();
      });
  }

  getHeadToHeadStats(login1, login2) {
    var matches = [];
    var stats = {
      matches: [],
      victories: 0,
      defeats: 0,
      draws: 0,
      numMatches: 0,
    };
    var query = playerQueries.getMatches(login1);
    return esutil
      .sendQuery(query)
      .then((res) => {
        if (!res.data.aggregations.unique_ids.buckets.length) return [];
        var resultMatches = res.data.aggregations.unique_ids.buckets;
        matches = resultMatches.map((match) => {
          return match.key;
        });
        return matches;
      })
      .then((matches) => {
        var query = playerQueries.getMatchesByPlayerAndMatchList(
          login2,
          matches
        );
        return esutil.sendQuery(query).then((res) => {
          if (!res.data.aggregations.byOtherPlayer.unique_ids.buckets.length)
            return [];
          var resultMatches =
            res.data.aggregations.byOtherPlayer.unique_ids.buckets;
          matches = resultMatches.map((match) => {
            return match.key;
          });
          return matches;
        });
      })
      .then((matches) => {
        var query = playerQueries.getMatchesByPlayer(login1, matches);
        return esutil.sendQuery(query).then((result) => {
          var games = result.data.aggregations.games.buckets;
          games = result.data.aggregations.games.buckets
            .filter((game) => {
              if (
                !game.gameInfo.map.buckets.length ||
                !game.gameInfo.numPlayers.buckets.length ||
                !game.gameInfo.numTeams.buckets.length ||
                !game.result.winningTeam.buckets.length ||
                !game.player.timePlayed.perTeam.buckets.length
              )
                return false;
              return true;
            })
            .map((match) => {
              return this.formatMatch(match);
            })
            .filter((match) => {
              return match.enemies.indexOf(login2) > -1;
            });
          return games;
        });
      })
      .then((matches) => {
        matches.forEach((match) => {
          if (match.result == "victory") stats.victories++;
          else if (match.result == "defeat") stats.defeats++;
          else stats.draws++;
        });
        stats.matches = matches;

        return stats;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getTopFraggers() {
    var classes = [];
    var query = playerQueries.getTopFraggers();
    return esutil
      .sendQuery(query)
      .then((res) => {
        return Promise.resolve(
          res.data.aggregations.all_matching_docs.buckets.all
        );
      })
      .then((result) => {
        classes.push({
          name: "Scout",
          players: result.scout.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Sniper",
          players: result.sniper.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Soldier",
          players: result.soldier.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Demoman",
          players: result.demoman.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Medic",
          players: result.medic.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "HWGuy",
          players: result.hwguy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Pyro",
          players: result.pyro.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Spy",
          players: result.spy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Engineer",
          players: result.engineer.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        return classes;
      })
      .catch((err) => {
        return Promise.reject();
      });
  }

  getTopDamage() {
    var classes = [];
    var query = playerQueries.getTopDamage();
    return esutil
      .sendQuery(query)
      .then((res) => {
        return Promise.resolve(
          res.data.aggregations.all_matching_docs.buckets.all
        );
      })
      .then((result) => {
        classes.push({
          name: "Scout",
          players: result.scout.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Sniper",
          players: result.sniper.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Soldier",
          players: result.soldier.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Demoman",
          players: result.demoman.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Medic",
          players: result.medic.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "HWGuy",
          players: result.hwguy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Pyro",
          players: result.pyro.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Spy",
          players: result.spy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Engineer",
          players: result.engineer.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        return classes;
      })
      .catch((err) => {
        return Promise.reject();
      });
  }

  getTopGoals() {
    var classes = [];
    var query = playerQueries.getTopGoals();
    return esutil
      .sendQuery(query)
      .then((res) => {
        return Promise.resolve(
          res.data.aggregations.all_matching_docs.buckets.all
        );
      })
      .then((result) => {
        classes.push({
          name: "Scout",
          players: result.scout.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Sniper",
          players: result.sniper.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Soldier",
          players: result.soldier.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Demoman",
          players: result.demoman.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Medic",
          players: result.medic.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "HWGuy",
          players: result.hwguy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Pyro",
          players: result.pyro.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Spy",
          players: result.spy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Engineer",
          players: result.engineer.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        return classes;
      })
      .catch((err) => {
        return Promise.reject();
      });
  }

  getTopFumbles() {
    var classes = [];
    var query = playerQueries.getTopFumbles();
    return esutil
      .sendQuery(query)
      .then((res) => {
        return Promise.resolve(
          res.data.aggregations.all_matching_docs.buckets.all
        );
      })
      .then((result) => {
        classes.push({
          name: "Scout",
          players: result.scout.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Sniper",
          players: result.sniper.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Soldier",
          players: result.soldier.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Demoman",
          players: result.demoman.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Medic",
          players: result.medic.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "HWGuy",
          players: result.hwguy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Pyro",
          players: result.pyro.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Spy",
          players: result.spy.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        classes.push({
          name: "Engineer",
          players: result.engineer.buckets.map((player) => {
            return { login: player.key, per10min: player.per10min.value };
          }),
        });
        return classes;
      })
      .catch((err) => {
        return Promise.reject();
      });
  }

  setUserRating(login, mu, sigma) {
    var userLogin = this.db.collection("users");
    return userLogin
      .where("login", "==", login)
      .get()
      .then((result) => {
        var userRef = this.db
          .collection("users")
          .doc(result.docs[0].data().uid);
        return userRef.set({ mu: mu, sigma: sigma }, { merge: true });
      });
  }

  setRatings(month) {
    var month = moment(month, "MM-YYYY");
    var startDate = moment
      .tz(month.startOf("month"), "America/Sao_Paulo")
      .toISOString();
    var endDate = moment
      .tz(month.endOf("month"), "America/Sao_Paulo")
      .toISOString();
    return esutil
      .sendQuery(matchQueries.getMatchRankings(startDate, endDate))
      .then((qResult) => {
        var matches = qResult.data.aggregations.games.buckets;
        return esutil.sendQuery(playerQueries.getPlayers()).then((result) => {
          var players = result.data.aggregations.players.buckets
            .filter((pl) => {
              if (pl.key == "" || pl.key == "world") return false;
              return true;
            })
            .map((pl) => {
              return { login: pl.key, rating: env.createRating(), games: 0 };
            });

          var getPlayer = function (login) {
            for (var player of players) {
              if (player.login == login) return player;
            }
          };
          matches = matches.reverse();
          matches = matches.map((match) => {
            var returnGame = {};
            returnGame.startTime = match.key.gameTimeStamp;
            returnGame["map"] =
              match.gameInfo.documents.hits.hits[0]._source.map;
            returnGame.demo =
              match.gameInfo.documents.hits.hits[0]._source.demo;
            returnGame.numPlayers =
              match.gameInfo.documents.hits.hits[0]._source.numPlayers;
            returnGame.numTeams =
              match.gameInfo.documents.hits.hits[0]._source.numTeams;
            returnGame.winningTeam =
              match.result.documents.hits.hits[0]._source.winningTeam;
            returnGame.teams = [];
            for (var i = 1; i <= 4; i++) {
              if (
                match.result.documents.hits.hits[0]._source["team" + i + "Name"]
              )
                returnGame.teams.push({
                  name:
                    match.result.documents.hits.hits[0]._source[
                    "team" + i + "Name"
                    ],
                  score:
                    match.result.documents.hits.hits[0]._source[
                    "team" + i + "Score"
                    ],
                  number: i,
                  players: [],
                });
            }

            //removing players without login or name
            match.timePlayed.byPlayer.value = match.timePlayed.byPlayer.value.filter(
              (player) => {
                return player.login && player.login.length > 0;
              }
            );

            for (var player of match.timePlayed.byPlayer.value) {
              var mostTime = 0;
              var playerTeamNum;
              player.byTeam = player.byTeam.sort((a, b) =>
                Object.values(a)[0] < Object.values(b)[0]
                  ? 1
                  : Object.values(b)[0] < Object.values(a)[0]
                    ? -1
                    : 0
              );

              if (Object.values(player.byTeam[0])[0] > 0) {
                var playerTeamNum =
                  parseInt(Object.keys(player.byTeam[0])[0]) - 1;
                returnGame.teams[playerTeamNum].players.push(player.login);
              }
            }

            var winningTeam =
              match.result.documents.hits.hits[0]._source.winningTeam;

            if (match.timePlayed.byPlayer.value.length && winningTeam > 0) {
              var winners = [];
              var losers = [];
              for (var player of match.timePlayed.byPlayer.value) {
                if (parseInt(Object.values(player.byTeam[0])[0]) > 0) {
                  if (Object.keys(player.byTeam[0])[0] == winningTeam) {
                    winners.push(player.login);
                  } else losers.push(player.login);
                }
              }

              var winRatings = [];
              var loseRatings = [];
              winners.forEach((winner) => {
                winRatings.push(getPlayer(winner).rating);
              });
              losers.forEach((loser) => {
                loseRatings.push(getPlayer(loser).rating);
              });

              // q is quality of the match with the players at their current rating
              const q = trueskill.rate([winRatings, loseRatings]);
              var pointsChange = {};

              for (var i = 0; i < q[0].length; i++) {
                let prevPoints = Math.round(
                  (getPlayer(winners[i]).rating.mu -
                    getPlayer(winners[i]).rating.sigma) *
                  100
                );
                getPlayer(winners[i]).rating = q[0][i];
                let points = Math.round(
                  (getPlayer(winners[i]).rating.mu -
                    getPlayer(winners[i]).rating.sigma) *
                  100
                );
                pointsChange[winners[i]] = points - prevPoints;
                getPlayer(winners[i]).games++;
              }
              for (var i = 0; i < q[1].length; i++) {
                let prevPoints = Math.round(
                  (getPlayer(losers[i]).rating.mu -
                    getPlayer(losers[i]).rating.sigma) *
                  100
                );
                getPlayer(losers[i]).rating = q[1][i];
                let points = Math.round(
                  (getPlayer(losers[i]).rating.mu -
                    getPlayer(losers[i]).rating.sigma) *
                  100
                );
                pointsChange[losers[i]] = points - prevPoints;
                getPlayer(losers[i]).games++;
              }
              returnGame.pointsChange = pointsChange;
              return returnGame;
              //console.log("Winners: " + winners + " / Losers: " + losers);
            } else {
              var teams = [];
              for (var player of match.timePlayed.byPlayer.value) {
                if (Object.values(player.byTeam[0])[0] > 0) {
                  if (!teams[Object.keys(player.byTeam[0])[0] - 1])
                    teams[Object.keys(player.byTeam[0])[0] - 1] = [];
                  teams[Object.keys(player.byTeam[0])[0] - 1].push(
                    player.login
                  );
                }
              }
              if (teams.length > 1) {
                var teamsRatings = [];
                teams.forEach((team, index) => {
                  teamsRatings[index] = [];
                  team.forEach((player) => {
                    teamsRatings[index].push(getPlayer(player).rating);
                  });
                });
                const q = trueskill.rate(teamsRatings, [0, 0]);
                var pointsChange = {};
                teams.forEach((team, index) => {
                  for (var i = 0; i < q[index].length; i++) {
                    let prevPoints = Math.round(
                      (getPlayer(team[i]).rating.mu -
                        getPlayer(team[i]).rating.sigma) *
                      100
                    );
                    getPlayer(team[i]).rating = q[index][i];
                    let points = Math.round(
                      (getPlayer(team[i]).rating.mu -
                        getPlayer(team[i]).rating.sigma) *
                      100
                    );
                    pointsChange[team[i]] = points - prevPoints;
                    getPlayer(team[i]).games++;
                  }
                });
                returnGame.pointsChange = pointsChange;
              }
              return returnGame;
            }
          });
          //remove matches with less than one team playing
          matches = matches.filter((match) => {
            return match.teams.length > 1;
          });
          var maxMatches = players.reduce(
            (max, player) => (max > player.games ? max : player.games),
            null
          );
          var minMatches = Math.floor(maxMatches / 5); //maxMatches/10 < 10 ? Math.floor(maxMatches/10) : 10;
          players = players
            .map((player) => {
              return {
                login: player.login,
                points: Math.round(
                  (player.rating.mu - player.rating.sigma) * 100
                ),
                mu: player.rating.mu,
                sigma: player.rating.sigma,
                beta: player.rating.beta,
                tau: player.rating.tau,
                games: player.games,
              };
              //this.setUserRating(player.login, player.rating.mu, player.rating.sigma)
            })
            .filter((player) => {
              return player.games >= minMatches;
            })
            .sort(function (a, b) {
              return b.points - a.points;
            });
          return {
            matches: matches,
            rankings: { minMatches: minMatches, players: players },
          };
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

module.exports = new UserService();
