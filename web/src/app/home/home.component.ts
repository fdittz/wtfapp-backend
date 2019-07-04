import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { PaginationComponent } from '../pagination/pagination.component'
import * as moment from "moment"

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  msgError: string;
  stats: any;
  matches: any;  
  servers: any;
  classRank: any;
  rankings: any;
  classesImg = [];
  currentRank: string;
  ranks = [];
  p: number = 1;
  matchTerms: string;
  constructor(public auth: AuthService,
    private http: HttpClient) { }

  ngOnInit() {
    this.classesImg[1] = {name: "Scout", image: "https://wiki.megateamfortress.com/images/thumb/6/69/Scout.png/300px-Scout.png", css: "bg-info"};
    this.classesImg[2] = {name: "Sniper", image: "https://wiki.megateamfortress.com/images/thumb/8/8f/Sniper.png/300px-Sniper.png", css: "bg-gray"};
    this.classesImg[3] = {name: "Soldier", image: "https://wiki.megateamfortress.com/images/thumb/7/7b/Soldier.png/300px-Soldier.png", css: "bg-blue"};
    this.classesImg[4] = {name: "Demoman", image: "https://wiki.megateamfortress.com/images/thumb/f/fd/Demoman.png/300px-Demoman.png", css: "bg-red"};
    this.classesImg[5] = {name: "Medic", image: "https://wiki.megateamfortress.com/images/thumb/2/26/Medic.png/300px-Medic.png", css: "bg-green"};
    this.classesImg[6] = {name: "HWGuy", image: "https://wiki.megateamfortress.com/images/thumb/4/48/Hwguy.png/300px-Hwguy.png", css: "bg-gray"};
    this.classesImg[7] = {name: "Pyro", image: "https://wiki.megateamfortress.com/images/thumb/c/c8/Pyro.png/300px-Pyro.png", css: "bg-gray"};
    this.classesImg[8] = {name: "Spy", image: "https://wiki.megateamfortress.com/images/thumb/3/36/Spy.png/300px-Spy.png", css: "bg-black"};
    this.classesImg[9] = {name: "Engineer", image: "https://wiki.megateamfortress.com/images/thumb/d/d8/Engineer.png/300px-Engineer.png", css: "bg-yellow"}; 
    this.getMatches();
    this.getRankings();
    this.ranks = [this.getFragRanks()];
    this.ranks[Math.floor(Math.random() * this.ranks.length)];
    //this.getServers();
  }

  async getMatches() {
    return this.http.get(`/api/matches`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.stats = resp;
      this.matches = this.stats;
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  async getServers() {
    return this.http.get(`/api/servers/registered`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.servers = resp;
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  async getRankings() {
    return this.http.get(`/api/users/usr/ranks`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.rankings = resp;
      this.rankings.players = this.rankings.players.map(player => {
        player.mu = Math.round(player.mu*100);
        return player;
      });
      console.log(this.rankings)
    }, resp => {
        this.msgError = resp.error.message;
    })
  }
  

  async getFragRanks() {
    return this.http.get(`/api/users/top/fraggers`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.classRank = resp;
      this.currentRank = "Frags/10min"
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  async getDamageRanks() {
    return this.http.get(`/api/users/top/damage`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.classRank = resp;
      this.currentRank = "Damage/10min"
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  searchMatches(event) {
      console.log(event)
      this.matches = this.stats.filter(match => {
        if (event.length > 2) {
            var terms = event.split(" ");
            for (var term of terms) {              
              if (!((JSON.stringify(match).indexOf(term) >= 0) || (moment(match.startTime).format("DD/MM/YYYY HH:MM").indexOf(term) >= 0)))
                return false;
            }
            return true;
          }
        else
          return true;
      })
  }
}

/*
{"startTime":"2019-06-17T19:59:09.236Z","map":"wellgl1","demo":"2019-06-17_16-58_[wellgl1]_tdf_kaue_vs_wos_caxa.mvd","numPlayers":4,"numTeams":2,"winningTeam":1,"teams":[{"name":"blue","score":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":10,"doc_count":1}]},"number":1,"players":["tdf","kaue"]},{"name":"red","score":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":0,"doc_count":1}]},"number":2,"players":["caxa","wos"]}]}*/
