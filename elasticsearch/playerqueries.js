var player = {
    getMatches(login) {
        return `{
            "size": 0,
            "query" : {
              "bool" : {
                 "should" : [ 
                    { "term" : { "player" : "${login}" } }
                 ]
              }
            },
            "aggs":{
              "unique_ids": {
                "terms": {
                  "field": "gameTimeStamp"
                }
              }
            }
          }`
    },
    getMatchDetails(login, gameTimeStamp) {
        return `{
            "size": 0,
            "query" : {
              "bool" : {
                 "should" : [ 
                    { "term" : { "gameTimeStamp" : "${gameTimeStamp}" } }
                 ]
              }
            },
            "aggs":{
              "game": {
                "filter": {
                  "term": {
                    "type": "gameStart"
                  }
                },
                "aggs": {
                  "data": {
                    "top_hits": {
                      "size": 1
                    }
                  }
                }
              },
              "result": {
                "filter": {
                  "term": {
                    "type": "teamScores"
                  }
                },
                "aggs": {
                  "data": {
                    "top_hits": {
                      "size": 1
                    }
                  }
                }
              },
          
                "player": {
                  "filter": {
                    "term" : {
                      "player": "${login}"
                    }
                  },
                  "aggs": {
                    "timePlayed": {
                      "filter": {
                        "term": {
                          "type": "changeClass"
                        }
                      },
                      "aggs": {
                        "perTeam": 
                        {
                          "terms": {
                            "field": "team",
                            "size": "2"
                          },
                          "aggs": {
                            "timePlayed": {
                              "sum": {
                                "field": "timePlayed"
                              }
                            },
                            "timePlayed_sort": {
                              "bucket_sort": {
                                "sort": [
                                  {"timePlayed": {"order": "desc"}}
                                ],
                                "size": 1
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              
            }
          }`
    }
}

module.exports = player;