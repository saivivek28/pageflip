import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingNotificationComponent } from './floating-notification.component';

describe('FloatingNotificationComponent', () => {
  let component: FloatingNotificationComponent;
  let fixture: ComponentFixture<FloatingNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
