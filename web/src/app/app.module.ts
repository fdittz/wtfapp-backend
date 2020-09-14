import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { FirstLoginComponent } from './first-login/first-login.component';
import { ProfileComponent } from './profile/profile.component';
import { LoginComponent } from './login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { FlexLayoutModule } from '@angular/flex-layout';
//import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RootComponent } from './root/root.component';
import { PlayerListComponent } from './player-list/player-list.component';
import {NgxPaginationModule} from 'ngx-pagination';
import { PaginationComponent } from './pagination/pagination.component';
import { NavbarComponent } from './navbar/navbar.component';
import { LoaderComponent } from './loader/loader.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from './services/loader.service';
import { LoaderInterceptor } from './interceptors/loader.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { HeadToHeadComponent } from './head-to-head/head-to-head.component';
import { MatchComponent } from './match/match.component';
import { MinutesSecondsPipe} from './util/minutes-seconds.pipe'
import { Config } from './app.config.js';
import { ResultSimComponent } from './result-sim/result-sim.component'



@NgModule({
  declarations: [
    AppComponent,
    FirstLoginComponent,
    ProfileComponent,
    LoginComponent,
    RootComponent,
    PlayerListComponent,
    PaginationComponent,
    NavbarComponent,
    LoaderComponent,
    HomeComponent,
    SideBarComponent,
    HeadToHeadComponent,
    MatchComponent,
    MinutesSecondsPipe,
    ResultSimComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(Config.getConfig()),
    AngularFirestoreModule,
    AngularFireAuthModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
   // ReactiveFormsModule,
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatGridListModule,
    NgxPaginationModule,
    BrowserModule,
    MatProgressSpinnerModule
  ],
  providers: [LoaderService, { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
