import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { auth } from 'firebase';

@Component({
  selector: 'app-first-login',
  templateUrl: './first-login.component.html',
  styleUrls: ['./first-login.component.scss']
})
export class FirstLoginComponent implements OnInit {

  nickname: string;
  msgError: string;
  constructor(
    public auth: AuthService,
    private http: HttpClient) {
  }


  ngOnInit() {
    this.msgError = "TESTY"

  }

  async registerNickname() {
      var self = this;
      this.http.get(`/api/users/registernickname/${this.nickname}`, {
          headers: new HttpHeaders().set('Authorization', `Bearer ${this.auth.accessToken}`)
        }).subscribe(resp => {
          console.log("AAAAAAAAAAAA")
          if (resp["status"] == 200) {
            this.msgError = "";
            this.auth.redirect("/");
          }
        }, resp => {
            this.msgError = resp.error.message;
        })

    
  
  }

}
