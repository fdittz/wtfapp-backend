import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,  ParamMap } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { User  } from '../model/user.model';
import {Location} from '@angular/common';
import * as trueskill from 'ts-trueskill';

@Component({
  selector: 'app-result-sim',
  templateUrl: './result-sim.component.html',
  styleUrls: ['./result-sim.component.scss']
})
export class ResultSimComponent implements OnInit {
  rankings: any;
  msgError: string;
  team1: string[] = new Array();
  team2: string[] = new Array();
  team1win: any;
  team2win: any;
  draw: any;
  current: any;
  quality: any;
  winProb: number[] = new Array();
  constructor(public auth: AuthService,
    private http: HttpClient,
    private location: Location,
    private route: ActivatedRoute,) {

  }
  

  ngOnInit() {
    this.getRankings()
    .then(_ => {
      this.route.paramMap.subscribe(paramMap => {
        if (paramMap["params"].team1p1 && paramMap["params"].team1p2 && paramMap["params"].team2p1 && paramMap["params"].team2p2) {
          this.team1.push(paramMap["params"].team1p1);
          this.team1.push(paramMap["params"].team1p2);
          this.team2.push(paramMap["params"].team2p1);
          this.team2.push(paramMap["params"].team2p2);
          this.simulate();
        }
      });

    });
  }

  async getRankings() {
    return this.http.get(`/api/users/usr/ranks`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    })
    .toPromise()
    .then(resp => {
      this.rankings = resp;
    })
    .catch(err => {
      this.msgError = err.error.message;
    })
  }


  async simulate() {
    var self = this;
    var getPlayerRank = function(login) {
      return self.rankings.players.filter(rank => {
        if (rank.login == login)
          return true;
      });
    }
    
    try {
      var team1 = this.team1.map(player => {
        var playerRank = getPlayerRank(player)[0];
        return new trueskill.Rating(playerRank["mu"], playerRank["sigma"]);
      })
      var team2 = this.team2.map(player => {
        var playerRank = getPlayerRank(player)[0];
        return new trueskill.Rating(playerRank["mu"], playerRank["sigma"]);
      })

      if (team1.length > 1 && team2.length > 1)
      {
        var t1 = team1.map(pl => {
          return new trueskill.Rating(pl["mu"]-pl["sigma"], pl["sigma"]);
        })
        var t2 = team2.map(pl => {
          return new trueskill.Rating(pl["mu"]-pl["sigma"], pl["sigma"]);
        })

        this.quality = trueskill.quality([t1, t2]);
        //this.quality = trueskill.quality([[new trueskill.Rating(2000,666), new trueskill.Rating(2000,666)], [new trueskill.Rating(2000,666), new trueskill.Rating(2000,666)]]);
        this.winProb[0] = Math.round(trueskill.winProbability(t1, t2)*100);
        this.winProb[1] = 100-this.winProb[0];
        this.current = {
          team1: this.team1.map((login, index) => {
            return {login: login, points: Math.round((team1[index].mu - team1[index].sigma)*100)};
          }),
          team2: this.team2.map((login, index) => {
            return {login: login, points: Math.round((team2[index].mu - team2[index].sigma)*100)};
          }),
        }

        var result1 = trueskill.rate([team1,team2]);
        this.team1win = {
          team1: this.team1.map((login, index) => {
            var points = Math.round((result1[0][index].mu - result1[0][index].sigma)*100);
            return {login: login, points: points, diff: points - this.current.team1[index].points};
          }),
          team2: this.team2.map((login, index) => {
            var points = Math.round((result1[1][index].mu - result1[1][index].sigma)*100);
            return {login: login, points: points, diff: points - this.current.team2[index].points};
          }),
        }

        var result2 = trueskill.rate([team2,team1]);
        this.team2win = {
          team1: this.team1.map((login, index) => {
            var points = Math.round((result2[1][index].mu - result2[1][index].sigma)*100);
            return {login: login, points: points, diff: points - this.current.team1[index].points};
          }),
          team2: this.team2.map((login, index) => {
            var points = Math.round((result2[0][index].mu - result2[0][index].sigma)*100);
            return {login: login, points: points, diff: points - this.current.team2[index].points};
          }),
        }

        var result3 = trueskill.rate([team2,team1], [0, 0]);
        this.draw = {
          team1: this.team1.map((login, index) => {
            var points = Math.round((result3[1][index].mu - result3[1][index].sigma)*100);
            return {login: login, points: points, diff: points - this.current.team1[index].points};
          }),
          team2: this.team2.map((login, index) => {
            var points = Math.round((result3[0][index].mu - result3[0][index].sigma)*100);
            return {login: login, points: points, diff: points - this.current.team2[index].points};
          }),
        }
        
        this.location.replaceState(`/simulator/${this.team1[0]}/${this.team1[1]}/${this.team2[0]}/${this.team2[1]}`);

      }
    }
    catch (e) {
      console.log(e)
      this.msgError = "One or more players not found"
    }
  }

}
