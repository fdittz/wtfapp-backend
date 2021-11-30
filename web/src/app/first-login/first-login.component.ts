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

  login: string;
  msgError: string;
  constructor(
    public auth: AuthService,
    private http: HttpClient) {
  }


  ngOnInit() {
  }

  async registerLogin() {
      if (!this.login.match("[A-Za-z0-9_]+") || this.login.indexOf(" ") >= 0)
      {
        this.msgError = "Invalid login";
        return;
      }
      this.login = this.login.toLowerCase();
      this.http.post(`/api/users/registerlogin`, {login: this.login}, {
          headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
        }).subscribe(resp => {
          if (resp["status"] == 200) {
            this.msgError = "";
            this.auth.redirect("/");
          }
        }, resp => {
            this.msgError = resp.error.message;
            console.log(this.msgError);
        })
  }
}
