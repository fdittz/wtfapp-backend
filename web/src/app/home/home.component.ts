import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  msgError: string;
  stats: any;
  servers: any;
  fragRank: any;
  rankings: any;
  classesImg = [];
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
    this.getFragRanks();
    this.getRankings();
    //this.getServers();
  }

  async getMatches() {
    return this.http.get(`/api/matches`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.stats = resp;
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
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  async getFragRanks() {
    return this.http.get(`/api/users/top/fraggers`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.fragRank = resp;
    }, resp => {
        this.msgError = resp.error.message;
    })
  }
}
