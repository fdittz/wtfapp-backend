import { Component, OnInit, } from '@angular/core';
import { ActivatedRoute,  ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';
import { User  } from '../model/user.model';

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

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private afs: AngularFirestore
    ) { }

  ngOnInit() {
    var self = this;
    this.editSecret = false;
    this.showAlias = false;
    this.route.paramMap.subscribe(paramMap => {
      this.getProfileData(paramMap["params"].login);
    })
  }

  async getProfileData(login) {
    var self = this;
    return this.http.get(`/api/users/${login}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
      }).subscribe(resp => {
        this.player = <User>resp;
        if (this.auth.uid == this.player.uid && !this.player.secret) {
          this.editSecret = true;
        }
      }, resp => {
          this.msgError = resp.error.message;
      })
  }

  private updateSecret() {
    if (!this.secret) {
      this.msgError = "No secret supplied";
      return;
    }
    var secretButton = <HTMLInputElement> document.getElementById("secretBtn");
    secretButton.innerHTML = ""
    secretButton.classList.add("loader");
    secretButton.disabled = true;
		const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${this.auth.uid}`);
    console.log(this.secret);
    var salt = CryptoJS.lib.WordArray.random(16).toString().slice(0,16);
    var hmac = CryptoJS.HmacSHA512(this.secret,salt);
    var saltedHash = CryptoJS.enc.Base64.stringify(hmac);
    console.log(salt);
		const data = {
      uid: this.auth.uid,
			secret: saltedHash,
			salt: salt
		}
		return userRef.set(data, { merge: true }).then(_ => {
      this.getProfileData(this.player.login).then(_ => {
        this.secretSet = true;
        secretButton.innerHTML = ""
        secretButton.disabled = false;
      });
      
    });
		
	}

}
