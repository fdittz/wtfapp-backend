var player = {
    getMatches(login) {
        return `{
          "size": 0,
          "query": {
            "bool": {
              "should": [
                {
                  "term": {
                    "player": "${login}"
                  }
                }
              ]
            }
          },
          "aggs": {
            "unique_ids": {
              "terms": {
                "field": "gameTimeStamp",
                "order": {
                  "_key": "desc"
                },
                "size": 10000
              }
            }
          }
        }`
    },
    
    getMatchesByPlayer(login, timeStampArray) {        
        var matchTerms = []
        timeStampArray.forEach(element => {
            matchTerms.push(`{
                                "term": {
                                "gameTimeStamp": "${element}"
                                }
                            }`)
        });
        matchTerms = matchTerms.join(",")
        return `
        {
            "size": 0,
            "query": {
              "bool": {
                "should": [
                  ${matchTerms}
                ],
                "minimum_should_match": 1
              }
            },
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
                  },
                  "player": {
                    "filter": {
                      "term": {
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
                          "perTeam": {
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
                                    {
                                      "timePlayed": {
                                        "order": "desc"
                                      }
                                    }
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
              }
            }
          }
        `

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
    },

    getTimePlayedByClassAndTeam(login) {
      return `
      {
        "size": 0,
        "aggs": {
          "attacker": {
            "filter": {
              "term": {
                "attacker": "${login}"
              }
            },
            "aggs": {
              "perClass": {
                "terms": {
                  "field": "attackerClass",
                  "size": "64"
                },
                "aggs": {
                  "enemy": {
                    "filter": {
                      "term": {
                        "kind": "enemy"
                      }
                    },
                    "aggs": {
                      "damage": {
                        "sum": {
                          "field": "damage"
                        }
                      },
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        }
                      }
                    }
                  },
                  "team": {
                    "filter": {
                      "term": {
                        "kind": "team"
                      }
                    },
                    "aggs": {
                      "damage": {
                        "sum": {
                          "field": "damage"
                        }
                      },
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "target": {
            "filter": {
              "term": {
                "target": "${login}"
              }
            },
            "aggs": {
              "perClass": {
                "terms": {
                  "field": "attackerClass",
                  "size": "64"
                },
                "aggs": {
                  "enemy": {
                    "filter": {
                      "term": {
                        "kind": "enemy"
                      }
                    },
                    "aggs": {
                      "damage": {
                        "sum": {
                          "field": "damage"
                        }
                      },
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        }
                      }
                    }
                  },
                  "team": {
                    "filter": {
                      "term": {
                        "kind": "team"
                      }
                    },
                    "aggs": {
                      "damage": {
                        "sum": {
                          "field": "damage"
                        }
                      },
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "player": {
            "filter": {
              "term": {
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
                  "total": {
                    "sum": {
                      "field": "timePlayed"
                    }
                  },
                  "perClass": {
                    "terms": {
                      "field": "previousClass",
                      "size": "64"
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
                            {
                              "timePlayed": {
                                "order": "desc"
                              }
                            }
                          ],
                          "size": 10
                        }
                      }
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
                      },
                      "timePlayed_sort": {
                        "bucket_sort": {
                          "sort": [
                            {
                              "timePlayed": {
                                "order": "desc"
                              }
                            }
                          ],
                          "size": 10
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      `
    },

    getMatchesByPlayerAndMatchList(login, timeStampArray) {
      var matchTerms = []
      timeStampArray.forEach(element => {
          matchTerms.push(`{
                              "term": {
                              "gameTimeStamp": "${element}"
                              }
                          }`)
      });
      matchTerms = matchTerms.join(",")
      return `
      {
        "size": 0,
        "query": {
          "bool": {
            "should": [
              ${matchTerms}
            ],
            "minimum_should_match": 1
          }
        },
        "aggs": {
          "byOtherPlayer": {
            "filter": {
              "term": {
                "player": "${login}"
              }
            },
            "aggs": {
              "unique_ids": {
                "terms": {
                  "field": "gameTimeStamp",
                  "order": {
                    "_key": "desc"
                  },
                  "size": 10000
                }
              }
            }
          }
        }
      }`
    
    }
}

module.exports = player;