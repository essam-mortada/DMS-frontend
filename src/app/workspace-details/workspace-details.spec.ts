import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { WorkspaceDetails } from './workspace-details';

describe('WorkspaceDetails', () => {
  let component: WorkspaceDetails;
  let fixture: ComponentFixture<WorkspaceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceDetails, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'test-id' })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
