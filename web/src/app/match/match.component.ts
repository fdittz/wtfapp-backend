import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,  ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';
import { User  } from '../model/user.model';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit {

  msgError: String;
  stats: any;
  classesImg = [];

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    ) { }

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

    var self = this;
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap["params"].matchId) {
        this.getMatchDetails(paramMap["params"].matchId);
      }
    });
  }

  async getMatchDetails(matchId) {
    return this.http.get(`/api/matches/${matchId}`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
        this.stats = resp;
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

}
