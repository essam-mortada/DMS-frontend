import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DocumentList } from './document-list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FolderService } from '../services/folder-service';
import { SearchService } from '../services/search-service';
import { of } from 'rxjs';

class MockFolderService {
  getFolderDocuments() {
    return of([]);
  }
}

class MockSearchService {
  searchTerm$ = of('');
  updateSearchTerm() {}
}

describe('DocumentList', () => {
  let component: DocumentList;
  let fixture: ComponentFixture<DocumentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentList, HttpClientTestingModule],
      providers: [
        { provide: MatSnackBar, useValue: {} },
        { provide: FolderService, useClass: MockFolderService },
        { provide: SearchService, useClass: MockSearchService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
