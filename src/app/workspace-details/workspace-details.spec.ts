import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceDetails } from './workspace-details';

describe('WorkspaceDetails', () => {
  let component: WorkspaceDetails;
  let fixture: ComponentFixture<WorkspaceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceDetails]
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
