import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CreateWorkspaceModal } from './create-workspace-modal';

describe('CreateWorkspaceModal', () => {
  let component: CreateWorkspaceModal;
  let fixture: ComponentFixture<CreateWorkspaceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWorkspaceModal, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateWorkspaceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
