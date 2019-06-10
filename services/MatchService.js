const matchQueries = require('../elasticsearch/matchqueries')
var esutil = require('../util/esutil');

class MatchService {

    getMatches() {
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
                            returnGame.teams.push({"name": game.result["team" + i +"Name"].buckets[0].key, "score": game.result["team" + i +"Score"]});
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
            console.log(res)
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
}

module.exports = new MatchService();