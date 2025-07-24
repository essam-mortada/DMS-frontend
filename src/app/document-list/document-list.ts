import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Document } from '../models/document.model';
import { DocumentService } from '../services/document';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-document-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css'
})
export class DocumentList {
  @Input() workspaceId!: string;
  @Input() folderId?: string;
  @Output() documentDeleted = new EventEmitter<void>();
  @Input() documents: Document[] = [];
  showUploadModal: boolean = false;
  documentService: DocumentService = new DocumentService(inject(HttpClient));
@Output() download = new EventEmitter<Document>();
@Output() delete = new EventEmitter<string>();
  constructor(private snackBar: MatSnackBar) {

  }
  ngOnInit(): void {
    this.getDocuments();
  }
  getDocuments(): void {
    this.snackBar.open('Loading documents...', undefined, { duration: 1500 });

    this.documentService.getByWorkspace(this.workspaceId).subscribe({
      next: (data: Document[]) => {
        this.documents = data;
        this.snackBar.open('Documents loaded successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.snackBar.open('Failed to load documents', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onDownload(document: Document): void {
    this.download.emit(document);
  }

  onDelete(documentId: string): void {
    this.delete.emit(documentId);
    this.documentDeleted.emit();
    this.snackBar.open('Document deleted successfully', 'Close', { duration: 3000 });
  }


}
