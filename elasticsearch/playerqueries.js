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
        matchTerms.push(`{
                            "terms": {
                              "gameTimeStamp": ${JSON.stringify(timeStampArray)},
                              "boost": 1.0
                            }
                         }`);

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
                    "filter": {
                      "term": {
                        "type": "changeClass"
                      }
                    },
                    "aggs": {
                      "timePlayed": {
                        "scripted_metric": {
                          "init_script": "state.players = [:];",
                          "map_script": "if (state.players[doc.player.value] == null) { state.players[doc.player.value] = [:]; state.players[doc.player.value]['1'] = []; state.players[doc.player.value]['2'] = []; state.players[doc.player.value]['3'] = []; state.players[doc.player.value]['4'] = []; state.players[doc.player.value].byTeam = [['1':0], ['2':0], ['3':0], ['4':0]] } state.players[doc.player.value]['1'].add(doc.team.value == 1 ? doc.timePlayed.value : 0); state.players[doc.player.value]['2'].add(doc.team.value == 2 ? doc.timePlayed.value : 0); state.players[doc.player.value]['3'].add(doc.team.value == 3 ? doc.timePlayed.value : 0); state.players[doc.player.value]['4'].add(doc.team.value == 4 ? doc.timePlayed.value : 0)",
                          "combine_script": "state.returnPlayers = []; Iterator it = state.players.entrySet().iterator(); while (it.hasNext()) { Map.Entry pair = (Map.Entry)it.next(); for (t in pair.getValue()['1']) pair.getValue().byTeam[0]['1'] += t; for (t in pair.getValue()['2']) pair.getValue().byTeam[1]['2'] += t; for (t in pair.getValue()['3']) pair.getValue().byTeam[2]['3'] += t; for (t in pair.getValue()['4']) pair.getValue().byTeam[3]['4'] += t; state.returnPlayers.add(['login':pair.getKey(), 'byTeam':pair.getValue().byTeam])} return state.returnPlayers",
                          "reduce_script": "return states[0]"
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
                      "scores": {
                        "scripted_metric": {
                          "init_script": "state.teams = new Object[2]; state.winner = 0",
                          "map_script": "if (state.teams[0] == null) {  if (doc.team1Name.size() > 0) state.teams[0] = ['name': doc.team1Name.value, 'score': doc.team1Score.value]; if (doc.team2Name.size() > 0) state.teams[1] = ['name': doc.team2Name.value, 'score': doc.team2Score.value]; if (doc.winningTeam.size() > 0) state.winningTeam = doc.winningTeam.value;}",
                          "combine_script": "return state",
                          "reduce_script": "return states"
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
              },
              "perClass": {
                "terms": {
                  "field": "playerClass",
                  "size": "64"
                },
                "aggs": {
                  "damageDone": {
                    "filter": {
                      "term": {
                        "type": "damageDone"
                      }
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
                          }
                        }
                      }
                    }
                  },
                  "kills": {
                    "filter": {
                      "term": {
                        "type": "kill"
                      }
                    },
                    "aggs": {
                      "enemy": {
                        "filter": {
                          "term": {
                            "kind": "enemy"
                          }
                        },
                        "aggs": {
                          "perWeapon": {
                            "terms": {
                              "field": "inflictor"
                            }
                          }
                        }
                      },
                      "team": {
                        "filter": {
                          "term": {
                            "kind": "team"
                          }
                        }
                      }
                    }
                  },
                  "damageTaken": {
                    "filter": {
                      "term": {
                        "type": "damageTaken"
                      }
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
                          }
                        }
                      }
                    }
                  },
                  "deaths": {
                    "filter": {
                      "term": {
                        "type": "death"
                      }
                    },
                    "aggs": {
                      "enemy": {
                        "filter": {
                          "term": {
                            "kind": "enemy"
                          }
                        }
                      },
                      "team": {
                        "filter": {
                          "term": {
                            "kind": "team"
                          }
                        }
                      }
                    }
                  },
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
                      }
                    }
                  },
                  "timePlayed_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "timePlayed>total": {
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
      `
    },

    getMatchesByPlayerAndMatchList(login, timeStampArray) {
      var matchTerms = []
      matchTerms.push(`{
                         "terms": {
                            "gameTimeStamp": ${JSON.stringify(timeStampArray)},
                            "boost": 1.0
                          }
                       }`);
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
    
    },

    getTopFraggers() {
      return `
      {
        "size": 0,
        "aggs": {
          "all_matching_docs": {
            "filters": {
              "filters": {
                "all": {
                  "match_all": {}
                }
              }
            },
            "aggs": {
              "scout": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 1
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.scout": {
                "percentiles_bucket": {
                  "buckets_path": "scout>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "sniper": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 2
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.sniper": {
                "percentiles_bucket": {
                  "buckets_path": "sniper>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "soldier": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 3
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.soldier": {
                "percentiles_bucket": {
                  "buckets_path": "soldier>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "demoman": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 4
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.demoman": {
                "percentiles_bucket": {
                  "buckets_path": "demoman>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "medic": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 5
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.medic": {
                "percentiles_bucket": {
                  "buckets_path": "medic>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "hwguy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 6
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.hwguy": {
                "percentiles_bucket": {
                  "buckets_path": "hwguy>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "pyro": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 7
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.pyro": {
                "percentiles_bucket": {
                  "buckets_path": "pyro>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "spy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 8
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.spy": {
                "percentiles_bucket": {
                  "buckets_path": "spy>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              },
              "engineer": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 9
                      }
                    },
                    "aggs": {
                      "kills": {
                        "filter": {
                          "term": {
                            "type": "kill"
                          }
                        },
                        "aggs": {
                          "enemy": {
                            "filter": {
                              "term": {
                                "kind": "enemy"
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classKills": "class>kills>enemy>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classKills/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                        "buckets_path": {
                            "minTime": "class>timePlayed>timePlayed"
                        },
                        "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.engineer": {
                "percentiles_bucket": {
                  "buckets_path": "engineer>per10min",
                  "percents": [ 99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]
                }
              }
            }
          }
        }
      }`;
    },
    
    getPlayers() {
      return `{
        "size": 0,
        "aggs": {
          "players": {
            "terms": {
              "field": "player",
              "size": "10000"
            }
          }
        }
      }`
    },

    getTopDamage() {
      return `{
        "size": 0,
        "aggs": {
          "all_matching_docs": {
            "filters": {
              "filters": {
                "all": {
                  "match_all": {}
                }
              }
            },
            "aggs": {
              "scout": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 1
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.scout": {
                "percentiles_bucket": {
                  "buckets_path": "scout>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "sniper": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 2
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.sniper": {
                "percentiles_bucket": {
                  "buckets_path": "sniper>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "soldier": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 3
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.soldier": {
                "percentiles_bucket": {
                  "buckets_path": "soldier>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "demoman": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 4
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.demoman": {
                "percentiles_bucket": {
                  "buckets_path": "demoman>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "medic": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 5
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.medic": {
                "percentiles_bucket": {
                  "buckets_path": "medic>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "hwguy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 6
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.hwguy": {
                "percentiles_bucket": {
                  "buckets_path": "hwguy>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "pyro": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 7
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.pyro": {
                "percentiles_bucket": {
                  "buckets_path": "pyro>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "spy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 8
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.spy": {
                "percentiles_bucket": {
                  "buckets_path": "spy>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "engineer": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 9
                      }
                    },
                    "aggs": {
                      "damageDone": {
                        "filter": {
                          "term": {
                            "type": "damageDone"
                          }
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
                              }
                            }
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classDamage": "class>damageDone>enemy>damage",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classDamage/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.minTime > 3599"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.engineer": {
                "percentiles_bucket": {
                  "buckets_path": "engineer>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              }
            }
          }
        }
      }`
    },

    getTopGoals() {
      return `{
        "size": 0,
        "aggs": {
          "all_matching_docs": {
            "filters": {
              "filters": {
                "all": {
                  "match_all": {}
                }
              }
            },
            "aggs": {
              "scout": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 1
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.scout": {
                "percentiles_bucket": {
                  "buckets_path": "scout>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "sniper": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 2
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                      "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.sniper": {
                "percentiles_bucket": {
                  "buckets_path": "sniper>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "soldier": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 3
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                      "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.soldier": {
                "percentiles_bucket": {
                  "buckets_path": "soldier>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "demoman": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 4
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.demoman": {
                "percentiles_bucket": {
                  "buckets_path": "demoman>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "medic": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 5
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.medic": {
                "percentiles_bucket": {
                  "buckets_path": "medic>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "hwguy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 6
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.hwguy": {
                "percentiles_bucket": {
                  "buckets_path": "hwguy>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "pyro": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 7
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.pyro": {
                "percentiles_bucket": {
                  "buckets_path": "pyro>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "spy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 8
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.spy": {
                "percentiles_bucket": {
                  "buckets_path": "spy>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "engineer": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 9
                      }
                    },
                    "aggs": {
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classGoals": "class>goals>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classGoals/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classGoals": "class>goals>_count"
                      },
                      "script": "params.minTime > 3599 && params.classGoals > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.engineer": {
                "percentiles_bucket": {
                  "buckets_path": "engineer>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              }
            }
          }
        }
      }`
    },

    getTopFumbles() {
      return `{
        "size": 0,
        "aggs": {
          "all_matching_docs": {
            "filters": {
              "filters": {
                "all": {
                  "match_all": {}
                }
              }
            },
            "aggs": {
              "scout": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 1
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.scout": {
                "percentiles_bucket": {
                  "buckets_path": "scout>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "sniper": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 2
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                      "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.sniper": {
                "percentiles_bucket": {
                  "buckets_path": "sniper>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "soldier": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 3
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                      "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.soldier": {
                "percentiles_bucket": {
                  "buckets_path": "soldier>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "demoman": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 4
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.demoman": {
                "percentiles_bucket": {
                  "buckets_path": "demoman>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "medic": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 5
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.medic": {
                "percentiles_bucket": {
                  "buckets_path": "medic>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "hwguy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 6
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.hwguy": {
                "percentiles_bucket": {
                  "buckets_path": "hwguy>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "pyro": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 7
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.pyro": {
                "percentiles_bucket": {
                  "buckets_path": "pyro>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "spy": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 8
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.spy": {
                "percentiles_bucket": {
                  "buckets_path": "spy>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              },
              "engineer": {
                "terms": {
                  "field": "player",
                  "size": "10000"
                },
                "aggs": {
                  "class": {
                    "filter": {
                      "term": {
                        "playerClass": 9
                      }
                    },
                    "aggs": {
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "timePlayed": {
                        "filter": {
                          "term": {
                            "type": "changeClass"
                          }
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
                  },
                  "per10min": {
                    "bucket_script": {
                      "buckets_path": {
                        "classfumbles": "class>fumbles>_count",
                        "classTime": "class>timePlayed>timePlayed"
                      },
                      "script": "params.classfumbles/(params.classTime/600)"
                    }
                  },
                  "restrict": {
                    "bucket_selector": {
                      "buckets_path": {
                        "minTime": "class>timePlayed>timePlayed",
                        "classfumbles": "class>fumbles>_count"
                      },
                      "script": "params.minTime > 3599 && params.classfumbles > 0"
                    }
                  },
                  "final_sort": {
                    "bucket_sort": {
                      "sort": [
                        {
                          "per10min": {
                            "order": "desc"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "percentiles.engineer": {
                "percentiles_bucket": {
                  "buckets_path": "engineer>per10min",
                  "percents": [
                    99,
                    95,
                    90,
                    85,
                    80,
                    75,
                    70,
                    65,
                    60,
                    55,
                    50,
                    45,
                    40,
                    35,
                    30,
                    25,
                    20,
                    15,
                    10,
                    5,
                    1
                  ]
                }
              }
            }
          }
        }
      }`
    }

    


}

module.exports = player;