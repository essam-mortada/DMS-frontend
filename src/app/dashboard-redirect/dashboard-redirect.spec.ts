import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardRedirect } from './dashboard-redirect';

describe('DashboardRedirect', () => {
  let component: DashboardRedirect;
  let fixture: ComponentFixture<DashboardRedirect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRedirect, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRedirect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
