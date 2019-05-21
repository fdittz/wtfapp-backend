import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,  ParamMap } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { User  } from '../model/user.model';


@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {

  players: Array<User>;
  pages: number;
  currentPage: number;
  msgError: string;

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      this.currentPage = paramMap["params"].page;
      this.getPlayerList(this.currentPage);
    })
  }

  async getPlayerList(page) {
    var self = this;
    if (!page)
      page = 1;
    return this.http.get(`/api/users/list/${page}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
      }).subscribe(resp => {
        var users = resp["users"];
        this.players = <Array<User>>users;
        this.pages = resp["pages"];
      }, resp => {
          this.msgError = resp.error.message;
      })
  }

}
