import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
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
  loading = false;
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
    });

    this.fetchDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspaceId'] || changes['folderId'] || changes['searchQuery']) {
      this.fetchDocuments();
    }
  }

  fetchDocuments(): void {
    if (this.searchQuery) {
      // The search logic can be improved to also use the service's state
      if (this.folderId) {
        this.documentService.searchDocumentsByFolder(this.folderId, this.searchQuery).subscribe(docs => this.documents = docs);
      } else if (this.workspaceId) {
        this.documentService.searchDocumentsByWorkspace(this.workspaceId, this.searchQuery).subscribe(docs => this.documents = docs);
      } else {
        this.documentService.searchDocuments(this.searchQuery).subscribe(docs => this.documents = docs);
      }
    } else {
      if (this.folderId) {
        this.documentService.fetchDocumentsByFolder(this.folderId);
      } else if (this.workspaceId) {
        this.documentService.fetchDocumentsByWorkspace(this.workspaceId);
      } else {
        this.documentService.fetchDocumentsByUser();
      }
    }
  }

  deleteDocument(documentId: string): void {
    this.loading = true;
    this.documentService.delete(documentId).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Document deleted successfully', 'Close', { duration: 3000 });
        this.fetchDocuments(); // Refetch documents after delete
      },
      error: (err) => {
        this.loading = false;
        console.error('Error deleting document:', err);
        this.snackBar.open('Failed to delete document', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  downloadDocument(documentId: string, documentName: string, documentType?: string) {
      if (!documentId) {
        this.snackBar.open('Document ID is missing', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

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
     'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'text/plain': 'txt',
    };
    return extensionMap[mimeType.toLowerCase()] || 'bin';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.documentsSub) {
      this.documentsSub.unsubscribe();
    }
  }
}
