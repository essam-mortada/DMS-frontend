import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicShare } from './public-share';

describe('PublicShare', () => {
  let component: PublicShare;
  let fixture: ComponentFixture<PublicShare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicShare]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicShare);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
