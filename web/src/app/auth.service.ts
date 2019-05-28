import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
//import { User } from './model/user.model'; // optional

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireDatabase, AngularFireAction } from '@angular/fire/database';

import { Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User  } from './model/user.model';
import { UserPrivate  } from './model/userprivate.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

	loginFailed$: boolean;
	redirectUrl: string;
	loggedInFirebase: boolean;
	accessToken: Promise<string>;

	user$: Observable<User>;
	uid: string;
	admin: boolean;

	constructor(
		private afAuth: AngularFireAuth,
		private afs: AngularFirestore,
		private router: Router,
		private http: HttpClient
	) { 
		this.user$ = this.afAuth.authState.pipe(
			switchMap(user => {
				if (user) {
					this.uid = user.uid;
					
				//	this.admin = user.admin;
					this.accessToken = user.getIdToken(true).then((idToken) => {
						return Promise.resolve(idToken);
					});
					return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
				}
				else {
					return of(null);
				}
			})
		)
		this.loginFailed$ = false;
	};

	async socialSignIn(provider) {
		var thisAuth = this;
		this.redirect(await this.afAuth.auth.signInWithPopup(provider)
		.then((credential) => {
			thisAuth.loginFailed$ = false;
			return this.updateUserData(credential.user).then(_ => {
				return credential.user;
			});
		})
		.then((user) => {
			return this.getUser(user).ref.get().then((doc) => {
				if (doc.exists) 
					if (!doc.data().login)
						return "/first";
					else {
						if (this.redirectUrl == "/")
							this.redirectUrl = `/profile/${doc.data().login}`;
						return this.redirectUrl ? this.router.parseUrl(this.redirectUrl) : `/profile/${doc.data().login}`;	
					}			
				else
					return "/";
			});
		})
		.catch(error => {
			this.loginFailed$ = true;
		}));	
	};

	public redirect(url) {
		let navigationExtras: NavigationExtras = {
          queryParamsHandling: 'preserve',
          preserveFragment: true
        };
        // Redirect the user
		this.router.navigateByUrl(url, navigationExtras);
	}

	private async updateUserData(user) {
		const data = {
			uid: user.uid,
			email: user.email,
			name: user.displayName,
			photoURL: user.photoURL
		}
		return this.http.post(`/api/users/new`, data, {
			headers: new HttpHeaders().set('Authorization', `Bearer ${await this.accessToken}`)
		}).subscribe(user => {
			return user;
		})
	}

	private getUser(user) {
		return this.afs.doc(`users/${user.uid}`);
	}

	async signOut() {
		await this.afAuth.auth.signOut();
		this.router.navigate(['/']);
	}
}
