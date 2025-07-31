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
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ShareModal } from '../share-modal/share-modal';
import { SharingService } from '../services/sharing';
import { SharePermission } from '../models/share-permission.model';
@Component({
  selector: 'app-document-list',
  imports: [CommonModule, RouterModule, FormsModule, ShareModal],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentList implements OnInit, OnChanges, OnDestroy {
  @Input() workspaceId?: string;
  @Input() folderId?: string;
  @Input() searchQuery: string = '';

  documents: Document[] = [];
  loading = false;
  viewMode: "grid" | "list" = "grid";
  selectedSort: string = 'name';
  showSortDropdown = false;

  showFilters = false
  selectedFileTypes: string[] = []
  selectedDateRange = ""
  activeFiltersCount = 0

   showShareModal = false;
  currentShareLink = '';
  selectedDocument: Document | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private documentService: DocumentService,
      private sharingService: SharingService,
  ) {}

  ngOnInit(): void {
    this.documentService.documents$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(documents => {
      this.documents = documents;
    });

    this.fetchDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspaceId'] || changes['folderId'] || changes['searchQuery']) {
      this.fetchDocuments();
    }
  }

  fetchDocuments(): void {
    const keyword = this.searchQuery ? this.searchQuery : undefined;
    const sort = this.selectedSort ? this.selectedSort : undefined;

    if (this.folderId) {
      this.documentService.fetchDocumentsByFolder(this.folderId, sort, keyword);
    } else if (this.workspaceId) {
      this.documentService.fetchDocumentsByWorkspace(this.workspaceId, sort, keyword);
    } else {
      this.documentService.fetchDocumentsByUser(sort, keyword);
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
    this.fetchDocuments();
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
    this.fetchDocuments();
  }

  clearAllFilters(): void {
    this.selectedFileTypes = []
    this.selectedDateRange = ""
    this.updateActiveFiltersCount()
    this.fetchDocuments();
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



  openShareModal(document: Document): void {
    this.selectedDocument = document;
    if (document.linkSharingEnabled && document.shareLinkToken) {
      this.currentShareLink = `${window.location.origin}/public/share/${document.shareLinkToken}`;
      this.showShareModal = true;
    } else {
      this.sharingService.createDocumentShareLink(document.id, SharePermission.VIEW).subscribe({
        next: (token) => {
          const updatedDocument = { ...document, linkSharingEnabled: true, shareLinkToken: token };
          this.documents = this.documents.map(d => d.id === document.id ? updatedDocument : d);
          this.currentShareLink = `${window.location.origin}/public/share/${token}`;
          this.showShareModal = true;
          this.snackBar.open('Share link created', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error creating share link:', err);
          this.snackBar.open('Failed to create share link', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.currentShareLink = '';
    this.selectedDocument = null;
  }

  deleteShareLink(): void {
    if (!this.selectedDocument) return;

    this.sharingService.deleteDocumentShareLink(this.selectedDocument.id).subscribe({
      next: () => {
        const updatedDocument = { ...this.selectedDocument!, linkSharingEnabled: false };
        this.documents = this.documents.map(d => d.id === this.selectedDocument!.id ? updatedDocument : d);
        this.snackBar.open('Share link deleted', 'Close', { duration: 3000 });
        this.closeShareModal();
      },
      error: (err) => {
        console.error('Error deleting share link:', err);
        this.snackBar.open('Failed to delete share link', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
