import { Component, OnInit, } from '@angular/core';
import { ActivatedRoute,  ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
iimport * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  msgError: String;
  player: Object;
  token: string;
  editSecret: boolean;

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
    ) { }

  ngOnInit() {
    var self = this;
    this.editSecret = false;
    this.route.paramMap.subscribe(paramMap => {
      this.getProfileData(paramMap["params"].nickname);
    })
  }

  async getProfileData(nickname) {
    var self = this;
    this.http.get(`/api/users/${nickname}`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
      }).subscribe(resp => {
        this.player = resp;
      }, resp => {
          this.msgError = resp.error.message;
          console.log(this.msgError);
      })
  }

  private updateSecret(secret) {

		const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${this.auth.uid}`);

		const data = {
			uid: user.uid,
			email: user.email,
			name: user.displayName,
			photoURL: user.photoURL
		}
		return userRef.set(data, { merge: true }) 
		
	}

}
