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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                        "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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
                      "script": "params.minTime > 599"
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