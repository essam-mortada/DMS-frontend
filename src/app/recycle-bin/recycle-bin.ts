import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Document } from '../models/document.model';
import { DocumentService } from '../services/document';
import { RouterModule } from '@angular/router';
import { Header } from "../header/header";



@Component({
  selector: 'app-recycle-bin',
  templateUrl: './recycle-bin.html',
  imports: [CommonModule, FormsModule, RouterModule, Header],
  standalone: true,
})
export class RecycleBinComponent implements OnInit, OnDestroy {
  deletedDocuments: Document[] = [];
  filteredDocuments: Document[] = [];
  selectedDocuments = new Set<string>();
  loading = false;
private _searchQuery = '';
  sortBy = 'updatedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private documentService: DocumentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchDeletedDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get searchQuery(): string {
  return this._searchQuery;
}
set searchQuery(value: string) {
  this._searchQuery = value;
  this.applyFilters();
}
  fetchDeletedDocuments(): void {
    this.loading = true;
    this.documentService.getDeletedDocuments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          console.log('Received deleted documents:', JSON.stringify(documents, null, 2));

          this.deletedDocuments = documents;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error('Error fetching deleted documents:', err);
          this.snackBar.open('Failed to fetch deleted documents', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }

  get totalDeletedSizeInMB(): string {
  if (!this.deletedDocuments) return '0.0';
  const totalBytes = this.deletedDocuments.reduce((sum, doc) => sum + doc.size!, 0);
  return (totalBytes / 1024 / 1024).toFixed(1);
}


applyFilters(): void {
  let docs = [...this.deletedDocuments];

  // Search
  if (this.searchQuery) {
    docs = docs.filter(doc =>
      doc.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Sorting
  docs.sort((a, b) => {
    const valA = this.getSortValue(a);
    const valB = this.getSortValue(b);

    if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  this.filteredDocuments = docs;
}

private getSortValue(doc: Document): any {
  switch (this.sortBy) {
    case 'name':
      return doc.name.toLowerCase();
    case 'size':
      return doc.size || 0;
    case 'deletedAt':
    case 'updatedAt':
      return doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
    case 'originalWorkspaceName':
    case 'workspaceId':
      return doc.workspaceId;
    default:
      return doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  }
}
  toggleSelectAll(): void {
    if (this.selectedDocuments.size === this.filteredDocuments.length) {
      this.selectedDocuments.clear();
    } else {
      this.filteredDocuments.forEach(doc => this.selectedDocuments.add(doc.id));
    }
  }

  toggleDocumentSelection(documentId: string): void {
    if (this.selectedDocuments.has(documentId)) {
      this.selectedDocuments.delete(documentId);
    } else {
      this.selectedDocuments.add(documentId);
    }
  }

  restoreDocument(document: Document): void {
    this.loading = true;
    this.documentService.restoreDocument(document.id).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open(`Document "${document.name}" restored successfully`, 'Close', { duration: 3000 });
        this.fetchDeletedDocuments();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error restoring document:', err);
        this.snackBar.open(`Failed to restore document "${document.name}"`, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }



  restoreSelected(): void {
    this.loading = true;
    const selectedIds = Array.from(this.selectedDocuments);
    const restorePromises = selectedIds.map(id => this.documentService.restoreDocument(id).toPromise());
    Promise.all(restorePromises).then(() => {
      this.loading = false;
      this.snackBar.open(`${selectedIds.length} documents restored successfully`, 'Close', { duration: 3000 });
      this.fetchDeletedDocuments();
      this.selectedDocuments.clear();
    }).catch(err => {
      this.loading = false;
      console.error('Error restoring selected documents:', err);
      this.snackBar.open('Failed to restore some documents', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    });
  }




  formatFileSize(size: number): string {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

 getFileIconClass(type: string | null | undefined): string {
  if (!type) return 'fa-file';
  if (type.includes('pdf')) return 'fa-file-pdf';
  if (type.includes('word')) return 'fa-file-word';
  if (type.includes('excel')) return 'fa-file-excel';
  if (type.includes('image')) return 'fa-image';
  return 'fa-file';
}
getFileType(type: string | null | undefined): string {
  if (!type) return 'File';
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word')) return 'Word';
  if (type.includes('excel')) return 'Excel';
  if (type.includes('image')) return 'Image';
  return 'File';
}

getFileTypeBadgeClass(type: string | null | undefined): string {
  if (!type) return 'badge-default';
  if (type.includes('pdf')) return 'badge-pdf';
  if (type.includes('word')) return 'badge-word';
  if (type.includes('excel')) return 'badge-excel';
  if (type.includes('image')) return 'badge-image';
  return 'badge-default';
}

  getDaysAgo(deletedAt: Date | string): number {
    const deletedDate = new Date(deletedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - deletedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
