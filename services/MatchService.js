const matchQueries = require('../elasticsearch/matchqueries')
var esutil = require('../util/esutil');

class MatchService {

    getMatches() {
        console.log("1111111111111111111111");
        var query = matchQueries.getMatches();
        return esutil.sendQuery(query)
        .then(result => {
            var games = result.data.aggregations.games.buckets;
                games = result.data.aggregations.games.buckets
                .filter( game => {
                    if (!game.gameInfo.map.buckets.length ||
                        !game.gameInfo.numPlayers.buckets.length ||
                        !game.gameInfo.numTeams.buckets.length ||
                        !game.result.winningTeam.buckets.length)
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
                    returnGame.winningTeam  = game.result.winningTeam.buckets[0].key;
                    returnGame.teams = []
                    for (var i = 1; i <= 4; i++) {
                        if (game.result["team" + i +"Name"] && game.result["team" + i +"Name"].buckets.length)
                            returnGame.teams.push({"name": game.result["team" + i +"Name"].buckets[0].key, "score": game.result["team" + i +"Score"], "number": i});
                    }                    

                    for (var i = 0; i < game.players.buckets.length; i++) {
                        var player = game.players.buckets[i];                        
                        if (player.timePlayed.perTeam.buckets[0] && player.timePlayed.perTeam.buckets[0].key != "") {
                            var playerTeamNum = parseInt(player.timePlayed.perTeam.buckets[0].key) - 1;
                            if (!returnGame.teams[playerTeamNum].players)
                                returnGame.teams[playerTeamNum].players = [];
                            returnGame.teams[playerTeamNum].players.push(player.key)
                        }
                    }
                    return (returnGame);
                })
                console.log(games)
                return games
            
           
        }).catch(err => {
            console.log(err);
            return Promise.reject();
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
        // console.log(query)
            return esutil.sendQuery(query)
            .then( result => {
                var games = result.data.aggregations.games.buckets;
                games = result.data.aggregations.games.buckets.map( game => {
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
        .catch(err => {
            console.log(err)
            return Promise.reject();
        })
    
    }

    getMatchDetails(matchId) { 
        var match = {
            gameTimeStamp: matchId,
            map: "",
            players: [],
            teams: []
        }
        var query = matchQueries.getMatchDetails(matchId);
          return esutil.sendQuery(query)
        .then(res => {
            match.map = (res.data.aggregations.byGame.game.data.hits.hits[0]._source.map);
            match.players = res.data.aggregations.byGame.player.buckets.map(player => {
                var returnPlayer = {};
                returnPlayer.perClass = player.timePlayed.perClass.buckets.map(perClassTime => {
                    return ({key: perClassTime.key, timePlayed: perClassTime.timePlayed.value});
                })
                returnPlayer.frags = player.playerkills.enemy.doc_count;
                returnPlayer.deaths = player.playerdeaths.enemy.doc_count;
                returnPlayer.teamKills = player.playerkills.team.doc_count;
                returnPlayer.teamDeaths = player.playerdeaths.team.doc_count;
                returnPlayer.damageDone = player.damageDone.enemy.sumdmg.value;
                returnPlayer.damageTaken = player.damageTaken.enemy.sumdmg.value;
                returnPlayer.fumbles = player.fumbles.doc_count;
                returnPlayer.goals = player.goals.doc_count;
                returnPlayer.login = player.key;
                if (player.timePlayed.perTeam.buckets && player.timePlayed.perTeam.buckets.length) {                    
                    returnPlayer.team = player.timePlayed.perTeam.buckets[0].key
                    if (!match.teams[returnPlayer.team-1])
                        match.teams[returnPlayer.team-1] = []
                    match.teams[returnPlayer.team-1].push(returnPlayer.login);
                }
                returnPlayer.playerKills = player.playersKilled.perPlayer.buckets.map(playerKilled => {
                    return {player: playerKilled.key, frags: playerKilled.doc_count }
                }).filter(player => {
                    return player.player && player.player.length
                });   
                returnPlayer.playersKilledBy = player.playersKilledBy.perPlayer.buckets.map(playerKilledBy => {
                    return {player: playerKilledBy.key, frags: playerKilledBy.doc_count }
                }).filter(player => {
                    return player.player && player.player.length
                });                
                return returnPlayer
            }).filter(player => {
                return ((player.login.length > 0) && (player.login != 'world')) 
            })
            match.goals = res.data.aggregations.byGame.goals.byPlayer.buckets.map(player => {
                return ({login: player.key, goals: player.doc_count});
            }).sort(function(a, b){
                return b.goals-a.goals
            })
            match.fumbles = res.data.aggregations.byGame.fumbles.byPlayer.buckets.map(player => {
                return ({login: player.key, fumbles: player.doc_count});
            }).sort(function(a, b){
                return b.fumbles-a.fumbles
            })
            return match
        });
    }

    getMatchPbp(matchId) {
        var query = matchQueries.getMatchPbp(matchId);
        return esutil.sendQuery(query)
        .then(res => { 
            var events = res.data.hits.hits.map(event => {
                return (event._source)
            });
            return events;            
        });
    } 
}

module.exports = new MatchService();