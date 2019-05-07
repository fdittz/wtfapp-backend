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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

	loginFailed$: boolean;
	redirectUrl: string;
	loggedInFirebase: boolean;
	accessToken: string;

	user$: Observable<User>;
	uid: string;

	constructor(
		private afAuth: AngularFireAuth,
		private afs: AngularFirestore,
		private router: Router
	) { 
		this.user$ = this.afAuth.authState.pipe(
			switchMap(user => {
				if (user) {
					this.uid = user.uid;
					user.getIdToken(true).then((idToken) => {
						this.accessToken = idToken;
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
			return this.updateUserData(credential.user).then(usuariu => {
				return credential.user;
			});
		})
		.then((user) => {
			return user.getIdToken(true).then(function(idToken) {
				console.log(thisAuth);
				thisAuth.accessToken = idToken;
				return user;
			})	
		})
		.then((user) => {
			return this.getUser(user).ref.get().then((doc) => {
				if (doc.exists) 
					if (!doc.data().nickname)
						return "/first";
					else
						return this.redirectUrl ? this.router.parseUrl(this.redirectUrl) : "/";				
				else
					return "/";
			});
		})
		.catch(error => {
			this.loginFailed$ = true;
		}));	
	};

	private redirect(url) {
		let navigationExtras: NavigationExtras = {
          queryParamsHandling: 'preserve',
          preserveFragment: true
        };
        // Redirect the user
		this.router.navigateByUrl(url, navigationExtras);
	}

	private updateUserData(user) {

		const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);

		const data = {
			uid: user.uid,
			email: user.email,
			name: user.displayName,
			photoURL: user.photoURL
		}
		return userRef.set(data, { merge: true }) 
		
	}

	async registerNickname(nickname) {

		const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${this.uid}`);
		const data = {
			uid: this.uid,
			nickname: nickname.toLowerCase()
		}
		
		userRef.set(data, { merge: true }).then(_ => { 
			console.log(userRef.ref.get().then(teste => {
				console.log("tt");
			}))
		});
	

		
		//return userRef.set(data, { merge: true }) 
		
	
  	}

	private getUser(user) {
		return this.afs.doc(`users/${user.uid}`);
	}

	async signOut() {
		await this.afAuth.auth.signOut();
		this.router.navigate(['/']);
	}
}
