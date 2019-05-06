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
import { MatCardModule, MatIconModule, MatToolbarModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatGridListModule } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
//import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


const config = {
    apiKey: "AIzaSyD0YSSJ8To0e6D24-aUC4sjImahZW6gYCg",
    authDomain: "quadclub-4e319.firebaseapp.com",
    databaseURL: "https://quadclub-4e319.firebaseio.com",
    projectId: "quadclub-4e319",
    storageBucket: "quadclub-4e319.appspot.com",
    messagingSenderId: "55669892839"
  };

var angu

@NgModule({
  declarations: [
    AppComponent,
    FirstLoginComponent,
    ProfileComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(config),
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
    MatGridListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
