var matches = {
    getMatches() {
        return `
            {
                "size": 0,
                "aggs": {
                "games": {
                    "composite": {
                    "sources": [
                        { "gameTimeStamp" : { "terms": { "field": "gameTimeStamp", "order": "desc"}}}
                    ],
                    "size": 10000
                    },
                    "aggs": {
                    "gameInfo": {
                        "filter": {
                        "term": {
                            "type": "gameStart"
                        }
                        },
                        "aggs": {
                        "numPlayers": {
                            "terms": {
                            "field": "numPlayers"
                            }
                        },
                        "numTeams": {
                            "terms": {
                            "field": "numTeams"
                            }
                        },
                        "map": {
                            "terms": {
                            "field": "map"
                            }
                        },
                        "demo": {
                            "terms": {
                            "field": "demo"
                            }
                        }
                        }
                    },
                    "players": {
                        "terms": {
                        "field": "player",
                        "size": 64
                        },
                        "aggs": {
                        "timePlayed": {
                            "filter": {
                            "term": {
                                "type": "changeClass"
                            }
                            },
                            "aggs": {
                            "total": {
                                "sum": {
                                "field": "timePlayed"
                                }
                            },
                            "perTeam": {
                                "terms": {
                                "field": "team",
                                "size": "64"
                                },
                                "aggs": {
                                "timePlayed": {
                                    "sum": {
                                    "field": "timePlayed"
                                    }
                                }
                                }
                            }
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
                        "team1Score": {
                            "terms": {
                            "field": "team1Score"
                            }
                        },
                        "team1Name": {
                            "terms": {
                            "field": "team1Name"
                            }
                        },
                        "team2Score": {
                            "terms": {
                            "field": "team2Score"
                            }
                        },
                        "team2Name": {
                            "terms": {
                            "field": "team2Name"
                            }
                        },
                        "winningTeam": {
                            "terms": {
                            "field": "winningTeam"
                            }
                        }
                        
                        
                        }
                    }
                    }
                }
                }
            }
       `
    }
}

module.exports = matches;