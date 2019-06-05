import { Component, OnInit, } from '@angular/core';
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
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  msgError: String;
  player: User;
  editSecret: boolean;
  secretSet: boolean;
  showAlias: boolean;
  login: string;
  secret: string;
  role: string;
  stats: any;
  
  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    ) { }

  ngOnInit() {
    var self = this;
    this.editSecret = false;
    this.showAlias = false;    
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap["params"].login) {
        this.auth.user$.subscribe(userdata => {
          if (userdata.login) {
            this.router.navigate([`/profile/${userdata.login}`]);
          }
        });
      }
      else {
        this.getProfileData(paramMap["params"].login);
        this.getStatsData(paramMap["params"].login);
      }
    });
    this.auth.user$.subscribe(userdata => {
      this.role = userdata.role;
    });
  }

  async getProfileData(login) {
    var self = this;
    return this.http.get(`/api/users/${login}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
      }).subscribe(resp => {
        this.player = <User>resp;
        if (this.auth.uid == this.player.uid && !this.player.secret) {
          if (!this.player.secret)
            this.editSecret = true;
        }
      }, resp => {
          this.msgError = resp.error.message;
      })
  }

  async getStatsData(login) {
    console.log("a")
    return this.http.get(`/api/users/profile/stats/${login}`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.stats = resp;
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  private async revokeAdmin() {
    return this.http.put(`/api/users/admin/revoke`, {login: this.player.login}, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
        this.player.role = null;   
    }, resp => {
        this.msgError = resp.error.message;
        console.log(this.msgError);
    })

  }

  private async grantAdmin() {
    return this.http.put(`/api/users/admin/grant`, {login: this.player.login}, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
       this.player.role = "admin"
    }, resp => {
        this.msgError = resp.error.message;
        console.log(this.msgError);
    })
  }

  private async updateSecret() {
    if (!this.secret) {
      this.msgError = "No secret supplied";
      return;
    }

    var secretButton = <HTMLInputElement> document.getElementById("secretBtn");
    //secretButton.innerHTML = ""
    //secretButton.classList.add("loader");
    secretButton.disabled = true;

    return this.http.post(`/api/users/secret`, {secret: this.secret}, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      if (resp["status"] == 200) {
        this.getProfileData(this.player.login).then(_ => {
          this.secretSet = true;
          //secretButton.innerHTML = ""
          secretButton.disabled = false;
        });
      }
    }, resp => {
        this.msgError = resp.error.message;
        console.log(this.msgError);
    })
  }
  
  formatTime(time: string) {
    return moment("2019-06-04T02:24:01.310Z").format("DD/MM/YYY HH:MM")
  }

}
