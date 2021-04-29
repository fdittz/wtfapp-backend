import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndexService {
  private index = new BehaviorSubject("")
  currentIndex = this.index.asObservable();

  constructor() { }

  changeIndex(index: string) {
    this.index.next(index);
  }
}
