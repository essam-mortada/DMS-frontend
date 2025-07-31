import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle';
import { ThemeService } from '../services/theme.service';
import { of } from 'rxjs';

class MockThemeService {
  darkMode$ = of(false);
  toggleDarkMode = jasmine.createSpy('toggleDarkMode');
}

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ThemeToggleComponent ],
      providers: [
        { provide: ThemeService, useClass: MockThemeService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
