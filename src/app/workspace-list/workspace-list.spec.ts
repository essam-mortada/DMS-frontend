import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkspaceList } from './workspace-list';

describe('WorkspaceList', () => {
  let component: WorkspaceList;
  let fixture: ComponentFixture<WorkspaceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceList, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
