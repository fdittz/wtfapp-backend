import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { auth } from 'firebase/app';
import { Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    constructor(public auth: AuthService, private router: Router) {};

    async googleSignIn() {
    	return this.auth.socialSignIn(new auth.GoogleAuthProvider());
    }

    ngOnInit() {
      $("body").addClass("hold-transition").addClass("login-page");
    }

}

