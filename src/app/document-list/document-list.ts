import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { Document } from '../models/document.model';
import { DocumentService } from '../services/document';
import { FolderService } from '../services/folder-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchService } from '../services/search-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentList implements OnInit, OnChanges, OnDestroy {
  @Input() workspaceId?: string;
  @Input() folderId?: string;
  @Input() searchQuery: string = '';

  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  loading = false;
  viewMode: "grid" | "list" = "grid";
  selectedSort: string = 'name';
  showSortDropdown = false;

  showFilters = false
  selectedFileTypes: string[] = []
  selectedDateRange = ""
  activeFiltersCount = 0

  private destroy$ = new Subject<void>();
  private documentsSub!: Subscription;

  constructor(
    private snackBar: MatSnackBar,
    private folderService: FolderService,
    private searchService: SearchService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.documentsSub = this.documentService.documents$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(documents => {
      this.documents = documents;
      this.filterAndSortDocuments();
    });

    this.fetchDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspaceId'] || changes['folderId']) {
      this.fetchDocuments();
    }
    if (changes['searchQuery']) {
      this.filterAndSortDocuments();
    }
  }

  fetchDocuments(): void {
    if (this.folderId) {
      this.documentService.fetchDocumentsByFolder(this.folderId);
    } else if (this.workspaceId) {
      this.documentService.fetchDocumentsByWorkspace(this.workspaceId);
    } else {
      this.documentService.fetchDocumentsByUser();
    }
  }

  filterAndSortDocuments(): void {
    let filtered = [...this.documents];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        (doc.type && doc.type.toLowerCase().includes(query))
      );
    }

    if (this.selectedFileTypes.length > 0) {
      filtered = filtered.filter(doc => this.selectedFileTypes.includes(doc.type));
    }

    // Date range filtering would be implemented here

    this.filteredDocuments = this.sortDocuments(filtered);
  }

  sortDocuments(documents: Document[]): Document[] {
    switch (this.selectedSort) {
      case 'name':
        return documents.sort((a, b) => a.name.localeCompare(b.name));
      case 'namedesc':
        return documents.sort((a, b) => b.name.localeCompare(a.name));
      case 'date':
        return documents.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'size':
        return documents.sort((a, b) => (b.size || 0) - (a.size || 0));
      case 'type':
        return documents.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      default:
        return documents;
    }
  }

  deleteDocument(documentId: string): void {
    this.loading = true;
    this.documentService.delete(documentId).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Document deleted successfully', 'Close', { duration: 3000 });
        this.fetchDocuments();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error deleting document:', err);
        this.snackBar.open('Failed to delete document', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  downloadDocument(documentId: string, documentName: string, documentType?: string) {
      this.snackBar.open(`Downloading ${documentName}...`, undefined, { duration: 1500 });
      this.documentService.download(documentId).subscribe({
        next: (blob: Blob) => {
          const extension = this.getExtensionFromMime(documentType || 'application/octet-stream');
          const fileName = `${documentName}.${extension}`;
          this.saveFile(blob, fileName);
          this.snackBar.open(`${documentName} downloaded successfully`, 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Download failed:', err);
          this.snackBar.open(`Failed to download ${documentName}`, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }

  private saveFile(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  private getExtensionFromMime(mimeType: string): string {
    const extensionMap: Record<string, string> = {
     'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
     'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx', 'image/jpeg': 'jpg', 'image/png': 'png', 'text/plain': 'txt',
    };
    return extensionMap[mimeType.toLowerCase()] || 'bin';
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement
    if (!target.closest(".sort-dropdown")) {
      this.showSortDropdown = false
    }
  }

  setViewMode(mode: "grid" | "list"): void {
    this.viewMode = mode
  }

  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown
  }

  selectSort(sortType: string): void {
    this.selectedSort = sortType
    this.showSortDropdown = false
    this.filterAndSortDocuments();
  }

  getSortDisplayName(): string {
    const sortNames: { [key: string]: string } = {
      name: "Name (A-Z)", namedesc: "Name (Z-A)", date: "Date Created", size: "File Size", type: "File Type",
    }
    return sortNames[this.selectedSort] || "Name (A-Z)"
  }

  resetSort(): void {
    this.selectedSort = "name"
    this.showSortDropdown = false
    this.filterAndSortDocuments();
  }

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
    this.filterAndSortDocuments();
  }

  setDateRange(range: string): void {
    this.selectedDateRange = this.selectedDateRange === range ? "" : range
    this.updateActiveFiltersCount()
    this.filterAndSortDocuments();
  }

  clearAllFilters(): void {
    this.selectedFileTypes = []
    this.selectedDateRange = ""
    this.updateActiveFiltersCount()
    this.filterAndSortDocuments();
  }

  hasActiveFilters(): boolean {
    return this.selectedFileTypes.length > 0 || this.selectedDateRange !== ""
  }

  private updateActiveFiltersCount(): void {
    this.activeFiltersCount = this.selectedFileTypes.length + (this.selectedDateRange ? 1 : 0)
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
    if (fileType.includes('image')) return 'fa-file-image';
    if (fileType.includes('audio')) return 'fa-music';
    return 'fa-file';
  }

  getFileIconClass(fileType: string): string {
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'excel';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('audio')) return 'music';
    return 'default';
  }

  getFileTypeDisplay(fileType: string): string {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('audio')) return 'music';
    return 'File';
  }

  getFileTypeBadgeClass(fileType: string): string {
    if (fileType.includes('pdf')) return 'badge-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'badge-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'badge-excel';
    if (fileType.includes('image')) return 'badge-image';
    if (fileType.includes('audio')) return 'badge-audio';
    return 'badge-default';
  }

  getFileSize(document: any): string {
    if (!document || !document.size) return 'Unknown size';
    const size = document.size;
    if (size < 1024) return `${size} B`;
    else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    else if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    else return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
