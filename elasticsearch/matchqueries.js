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
                                    {"timePlayed": {"order": "desc"}}
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
                          "term": {
                            "type": "kill"
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
                          "term": {
                            "type": "killSelf"
                          }
                        }
                      },
                      "playersKilledBy": {
                        "filter": {
                          "term": {
                            "type": "kill"
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

    getMatchRankings() {
      return `{
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
      }`;
    }


}

module.exports = matches;