var matches = {
    getMatches() {
        return `
        {
          "size": 0,
          "aggs": {
            "games": {
              "composite": {
                "sources": [
                  {
                    "gameTimeStamp": {
                      "terms": {
                        "field": "gameTimeStamp",
                        "order": "desc"
                      }
                    }
                  }
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
    },

    getMatchDetails(matchId) {
        return `
        {
            "size": 0,
            "aggs": {
              "byGame": {
                "filter": {
                  "term": {
                    "gameTimeStamp": "${matchId}"
                  }
                },
                "aggs": {
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
                  "players": {
                    "filter": {
                      "term": {
                        "type": "changeClass"
                      }
                    },
                    "aggs": {
                      "index": {
                        "terms": {
                          "field": "player",
                          "size": "64"
                        }
                      }
                    }
                  },
                  "player": {
                    "terms": {
                      "field": "player",
                      "size": "64"
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
                              "field": "playerClass",
                              "size": "64"
                            },
                            "aggs": {
                              "timePlayed": {
                                "sum": {
                                  "field": "timePlayed"
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
                                  "size": 1
                                }
                              }
                            }
                          }
                        }
                      },
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
                              "sumdmg": {
                                "sum": {
                                  "field": "damage"
                                }
                              }
                            }
                          },
                          "self": {
                            "filter": {
                              "term": {
                                "kind": "self"
                              }
                            },
                            "aggs": {
                              "sumdmg": {
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
                              "sumdmg": {
                                "sum": {
                                  "field": "damage"
                                }
                              }
                            }
                          }
                        }
                      },
                      "playerkills": {
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
                          "self": {
                            "filter": {
                              "term": {
                                "kind": "self"
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
                      "playersKilled": {
                        "filter": {
                          "bool": {
                            "must": {
                              "term": {
                                "type": "kill"
                              }
                            },
                            "must_not": {
                              "term": {
                                "kind": "self"
                              }
                            }
                          }
                        },
                        "aggs": {
                          "perPlayer": {
                            "terms": {
                              "field": "target",
                              "size": "64"
                            }
                          }
                        }
                      },
                      "shotsFired": {
                        "filter": {
                          "term": {
                            "type": "attack"
                          }
                        },
                        "aggs": {
                          "perWeapon": {
                            "terms": {
                              "field": "inflictor",
                              "size": "64"
                            }
                          }
                        }
                      },
                      "shotsHit": {
                        "filter": {
                          "term": {
                            "type": "damage"
                          }
                        },
                        "aggs": {
                          "perWeapon": {
                            "terms": {
                              "field": "inflictor",
                              "size": "64"
                            }
                          }
                        }
                      },
                      "fumbles": {
                        "filter": {
                          "term": {
                            "type": "fumble"
                          }
                        }
                      },
                      "goals": {
                        "filter": {
                          "term": {
                            "type": "goal"
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
                              "sumdmg": {
                                "sum": {
                                  "field": "damage"
                                }
                              }
                            }
                          },
                          "self": {
                            "filter": {
                              "term": {
                                "kind": "self"
                              }
                            },
                            "aggs": {
                              "sumdmg": {
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
                              "sumdmg": {
                                "sum": {
                                  "field": "damage"
                                }
                              }
                            }
                          }
                        }
                      },
                      "playerdeaths": {
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
                          "self": {
                            "filter": {
                              "term": {
                                "kind": "self"
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
                      "playersuicides": {
                        "filter": {
                          "bool": {
                            "must": [
                              {
                                "term": {
                                  "type": "kill"
                                }
                              },
                              {
                                "term": {
                                  "kind": "self"
                                }
                              }
                            ]
                          }
                        }
                      },
                      "playersKilledBy": {
                        "filter": {
                          "bool": {
                            "must": {
                              "term": {
                                "type": "death"
                              }
                            },
                            "must_not": {
                              "term": {
                                "kind": "self"
                              }
                            }
                          }
                        },
                        "aggs": {
                          "perPlayer": {
                            "terms": {
                              "field": "attacker",
                              "size": "64"
                            }
                          }
                        }
                      }
                    }
                  },
                  "fumbles": {
                    "filter": {
                      "term": {
                        "type": "fumble"
                      }
                    },
                    "aggs": {
                      "byPlayer": {
                        "terms": {
                          "field": "player",
                          "size": "64",
                          "order": {
                            "_count": "desc"
                          }
                        }
                      }
                    }
                  },
                  "goals": {
                    "filter": {
                      "term": {
                        "type": "goal"
                      }
                    },
                    "aggs": {
                      "byPlayer": {
                        "terms": {
                          "field": "player",
                          "size": "64",
                          "order": {
                            "_count": "desc"
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

    getMatchRankings(startDate, endDate) {
      let query = "";
      if (startDate && endDate) {
        query = `
        "query": {
          "range": {
            "gameTimeStamp": {
              "gte": "${startDate}",
              "lte": "${endDate}"
            }
          }
        },`
      }
      return `{
        "size": 0,
        ${query}
        "aggs": {
          "games": {
            "composite": {
              "sources": [
                {
                  "gameTimeStamp": {
                    "terms": {
                      "field": "gameTimeStamp",
                      "order": "desc"
                    }
                  }
                }
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
                  "documents": {
                    "top_hits": {
                      "size": 10
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
                  "byPlayer": {
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
                  "documents": {
                    "top_hits": {
                      "size": 10
                    }
                  }
                }
              }
            }
          }
        }
      }`;
    }


}

module.exports = matches;