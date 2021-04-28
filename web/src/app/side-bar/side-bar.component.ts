import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {

  user: any;
  userLoaded: boolean;
  constructor(public auth: AuthService) { 
    this.userLoaded = false;
  }

  ngOnInit() {
    this.auth.user$.subscribe(userdata => {
      this.user = userdata;
      this.userLoaded = true;
    });
  }

  async googleSignIn() {
    return this.auth.socialSignIn(new firebase.auth.GoogleAuthProvider());
  }

}
