import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,  ParamMap } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { User  } from '../model/user.model';
import { PaginationComponent } from '../pagination/pagination.component'
import { Location } from '@angular/common';



@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {

  p: any;
  players: Array<User>;
  pages: number;
  currentPage: number;
  numPlayers: number;
  msgError: string;
  firstUsers: Array<string>;
  perPage: number;

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      this.currentPage = paramMap["params"].page;
      this.getPlayerList();
    })
  }

  async getPlayerList(term:string = null) {
    var page = this.currentPage;
    if (!page)
      page = 1;
    var url = `/api/users/list/${page}`;
    if (term)
      var url = `/api/users/list/${term}/${page}`;
    return this.http.get(`/api/users/list/${page}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
      }).subscribe(resp => {
        var users = resp["users"];
        this.players = <Array<User>>users;
        this.pages = resp["pages"];
        this.numPlayers = resp["numUsers"];
        this.firstUsers = resp["firstUsers"];
        this.perPage = resp["perPage"];
      }, resp => {
          this.msgError = resp.error.message;
      })
  }


  async updatePlayerList() {
    var page = this.currentPage;
    if (!page)
      page = 1;
    var firstUser = this.firstUsers[page-1]
    return this.http.get(`/api/users/list/fetch/${firstUser}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
      }).subscribe(resp => {
        var users = resp["users"];
        this.players = <Array<User>>users;
        this.perPage = resp["perPage"];
      }, resp => {
          this.msgError = resp.error.message;
      })
  }

  pageChanged(event){
    this.currentPage = event;
    if (this.firstUsers)
      this.updatePlayerList();
    else
      this.getPlayerList();
    this.location.go(`/playerlist/${this.currentPage}`);
  }

}
