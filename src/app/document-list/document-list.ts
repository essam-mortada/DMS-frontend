import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Document } from '../models/document.model';
import { DocumentService } from '../services/document';
import { FolderService } from '../services/folder-service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EMPTY, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { takeUntil, catchError, switchMap } from 'rxjs/operators';
import { SearchService } from '../services/search-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentList implements OnInit, OnChanges, OnDestroy {
  @Input() workspaceId!: string;
  @Input() folderId?: string;
  @Input() refreshTrigger: number = 0;

  @Output() documentDeleted = new EventEmitter<string>();
    @Output() documentAdded = new EventEmitter<Document>();

  @Input() documents: Document[] = [];
  showUploadModal: boolean = false;
  loading = false;
  documentService: DocumentService = new DocumentService(inject(HttpClient));
  @Output() download = new EventEmitter<Document>();
  @Output() delete = new EventEmitter<string>();
  private destroy$ = new Subject<void>();
  filteredDocuments: Document[] = [];
  private searchSub!: Subscription;
  @Input() searchQuery: string = '';
  selectedSort: string = 'name';
  viewMode: "grid" | "list" = "grid"

  showSortDropdown = false

  showFilters = false
  selectedFileTypes: string[] = []
  selectedDateRange = ""
  activeFiltersCount = 0


  constructor(
    private snackBar: MatSnackBar,
    private folderService: FolderService,
    private searchService: SearchService,
    private DocumentService:DocumentService

  ) {}

  ngOnInit(): void {
    this.documentService.updateData.subscribe((res)=>{

      this.getDocuments();
    })
        this.updateActiveFiltersCount()
    this.searchSub = this.searchService.searchTerm$
      .pipe(
        switchMap((term) => {
          const trimmed = term.trim().toLowerCase();

          // No search term
          if (!trimmed) {
            if (this.folderId) {
              return this.folderService.getFolderDocuments(this.folderId);
            } else if (this.workspaceId) {
              return this.documentService.getByWorkspace(this.workspaceId);
            } else {
            return this.documentService.getByUser();
              return of([]);
            }
          }

          // With search term
          if (this.folderId) {
            return this.documentService.searchDocumentsByFolder(
              this.folderId,
              trimmed
            );
          } else if (this.workspaceId) {
            return this.documentService.searchDocumentsByWorkspace(
              this.workspaceId,
              trimmed
            );
          }else if(!this.folderId && !this.workspaceId){

            return this.documentService.getByUser();

          }
          else {
            console.warn('No workspaceId or folderId available for searching.');
            return of([]);
          }
        }),
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Search error:', err);
          this.snackBar.open('Failed to search documents', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          return of([]);
        })
      )
      .subscribe((results) => {
        this.documents = results;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const folderChanged = changes['folderId']?.currentValue;
    const workspaceChanged = changes['workspaceId']?.currentValue;
    const searchChanged = changes['searchQuery'];
    const documentsChanged = changes['documents'];


    const hasValidIds =
      this.isValidId(this.folderId) || this.isValidId(this.workspaceId);

    if (searchChanged) {
      this.searchService.updateSearchTerm(this.searchQuery);
    }

    if (hasValidIds && (folderChanged || workspaceChanged)) {
      this.getDocuments();
    }

    if(documentsChanged){
      this.getDocuments();
    }

    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.getDocuments();
    }
  }




  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement
    if (!target.closest(".sort-dropdown")) {
      this.showSortDropdown = false
    }
  }

  // View Mode
  setViewMode(mode: "grid" | "list"): void {
    this.viewMode = mode
  }

  // Sort functionality
  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown
  }

  selectSort(sortType: string): void {
    this.selectedSort = sortType
    this.showSortDropdown = false
    this.onSortChange()
  }

  getSortDisplayName(): string {
    const sortNames: { [key: string]: string } = {
      name: "Name (A-Z)",
      namedesc: "Name (Z-A)",
      date: "Date Created",
      size: "File Size",
      type: "File Type",
    }
    return sortNames[this.selectedSort] || "Name (A-Z)"
  }
  onSortChange(): void {
    this.getDocuments();
  }

   resetSort(): void {
    this.selectedSort = "name"
    this.showSortDropdown = false
    this.onSortChange()
  }



  // Filter functionality
  toggleFilters(): void {
    this.showFilters = !this.showFilters
  }

  toggleFileType(fileType: string): void {
    const index = this.selectedFileTypes.indexOf(fileType)
    if (index > -1) {
      this.selectedFileTypes.splice(index, 1)
    } else {
      this.selectedFileTypes.push(fileType)
    }
    this.updateActiveFiltersCount()
    this.getDocuments()
  }

  setDateRange(range: string): void {
    this.selectedDateRange = this.selectedDateRange === range ? "" : range
    this.updateActiveFiltersCount()
    this.getDocuments()
  }

  clearAllFilters(): void {
    this.selectedFileTypes = []
    this.selectedDateRange = ""
    this.updateActiveFiltersCount()
    this.getDocuments()
  }

  hasActiveFilters(): boolean {
    return this.selectedFileTypes.length > 0 || this.selectedDateRange !== ""
  }

  private updateActiveFiltersCount(): void {
    this.activeFiltersCount = this.selectedFileTypes.length + (this.selectedDateRange ? 1 : 0)
  }


  getDocuments(): void {
    this.snackBar.open('Loading documents...', undefined, { duration: 1500 });

    let documents$: Observable<Document[]>;
    const hasSearch = this.searchQuery && this.searchQuery.trim().length > 0;

    if (hasSearch) {
      documents$ = this.documentService.searchDocuments(this.searchQuery);
    } else if (this.isValidId(this.folderId)) {
      documents$ = this.folderService.getFolderDocuments(this.folderId!);
    } else if (this.isValidId(this.workspaceId)) {
      if (this.selectedSort && this.selectedSort.trim() !== '') {
        documents$ = this.documentService.getSortedDocuments(
          this.workspaceId,
          this.selectedSort
        );
      } else {
        documents$ = this.documentService.getByWorkspace(this.workspaceId);
      }
    }else if(!this.isValidId(this.folderId)&& !this.isValidId(this.workspaceId)){
        documents$ = this.documentService.getByUser();

    }
     else {
      this.snackBar.open('No valid folder or workspace ID provided', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    documents$
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Error loading documents:', err);
          this.snackBar.open(
            err?.message || 'Failed to load documents',
            'Close',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
          return of([]);
        })
      )
      .subscribe((documents: Document[]) => {
        this.documents = documents;

        const msg =
          documents.length === 0
            ? 'No documents found.'
            : 'Documents loaded successfully!';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      });
  }

  private isValidId(id: string | null | undefined): boolean {
    return id != null && id.trim() !== '';
  }

  onDownload(document: Document): void {
    this.download.emit(document);
  }

 onDocumentAdded(newDocument: Document | null, error?: any): void {
    this.documents = [newDocument!, ...this.documents];
     this.documentAdded.emit(newDocument!);
  if (error) {
    this.snackBar.open('Failed to upload document: ' + (error.message || 'Unknown error'), 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    this.loading = false;
    return;
  }

  if (!newDocument) {
    console.error('Received null/undefined document');
    this.snackBar.open('Document upload failed - no document received', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    return;
  }



   this.getDocuments();

  this.snackBar.open('Document added successfully!', 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });


}

 onDelete(documentId: string): void {
  this.loading = true;
  this.documentService.delete(documentId)
    .pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.loading = false;
        this.snackBar.open('Failed to delete document', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return throwError(err);
      })
    )
    .subscribe(() => {
      this.documentDeleted.emit();
      this.loading = false;
      this.getDocuments();
      this.snackBar.open('Document deleted successfully', 'Close', {
        duration: 3000,
      });
    });
}
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document'))
      return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet'))
      return 'fa-file-excel';
    if (fileType.includes('image')) return 'fa-file-image';
    if (fileType.includes('audio')) return 'fa-music';

    return 'fa-file';
  }

  getFileIconClass(fileType: string): string {
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('word') || fileType.includes('document'))
      return 'word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet'))
      return 'excel';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('audio')) return 'music';

    return 'default';
  }

  getFileTypeDisplay(fileType: string): string {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document'))
      return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet'))
      return 'Excel';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('audio')) return 'music';

    return 'File';
  }

  getFileTypeBadgeClass(fileType: string): string {
    if (fileType.includes('pdf')) return 'badge-pdf';
    if (fileType.includes('word') || fileType.includes('document'))
      return 'badge-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet'))
      return 'badge-excel';
    if (fileType.includes('image')) return 'badge-image';
    if (fileType.includes('audio')) return 'badge-audio';

    return 'badge-default';
  }

  getFileSize(document: any): string {
    if (!document || !document.size) return 'Unknown size';
    const size = document.size;
    if (size < 1024) return `${size} B`;
    else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    else if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    else return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
