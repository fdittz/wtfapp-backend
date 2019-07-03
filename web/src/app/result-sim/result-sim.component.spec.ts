import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultSimComponent } from './result-sim.component';

describe('ResultSimComponent', () => {
  let component: ResultSimComponent;
  let fixture: ComponentFixture<ResultSimComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultSimComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultSimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
