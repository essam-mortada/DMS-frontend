import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentUploadComponent } from './upload-modal';
import { DocumentService } from '../services/document';
import { WorkspaceService } from '../services/workspaceService';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockDocumentService {
  upload() {
    return of({});
  }
}

class MockWorkspaceService {
  getAll() {
    return of([]);
  }
}

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DocumentUploadComponent, HttpClientTestingModule ],
      providers: [
        { provide: DocumentService, useClass: MockDocumentService },
        { provide: WorkspaceService, useClass: MockWorkspaceService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
