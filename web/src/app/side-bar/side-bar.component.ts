import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {

  login: string;
  constructor(public auth: AuthService) { }

  ngOnInit() {
    this.auth.user$.subscribe(userdata => {
      if (userdata.login) {
        this.login = userdata.login;
      }
    });
  }

}
