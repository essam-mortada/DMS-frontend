import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../services/document';
import { WorkspaceService } from '../services/workspaceService';
import { Workspace } from '../models/workspace.model';
import { Dashboard } from '../dashboard/dashboard';
import { Document } from '../models/document.model';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-modal.html',
})
export class DocumentUploadComponent implements OnInit {
  documentService = inject(DocumentService);
  workspaceService = inject(WorkspaceService);
@Input() parentFolderId: string | null = null;
@Input() workspaceId: string | null = null;
  @Input() folderId: string | null = null;
@Output() documentAdded = new EventEmitter<Document>();
  @Output() close = new EventEmitter<void>();
  workspaces: Workspace[] = [];
  selectedWorkspaceId: string = '';

  selectedFile: File | null = null;
  constructor() {
  }
  ngOnInit() {
    this.workspaceService.getAll().subscribe({
      next: (data) => (this.workspaces = data),
      error: () => alert('Failed to load workspaces')
    });
  }

@Output() uploadComplete = new EventEmitter<{
  status: 'success' | 'error',
  document?: Document,
  error?: any
}>();



  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

upload() {
  if(this.workspaceId) {
    this.selectedWorkspaceId = this.workspaceId;
  } else if (!this.selectedWorkspaceId) {
    alert("Select a workspace first");
    return;
  }
  if (!this.selectedFile || !this.selectedWorkspaceId) {
    alert("Select file and workspace first");
    return;
  }

  const folderId = this.parentFolderId ?? null;

  this.documentService.upload(this.selectedFile, this.selectedWorkspaceId, folderId).subscribe({
    next: () => {
      this.close.emit();
      //this.documentService.updateData.next(true);
      //this.dashboard.refreshDocuments();
    },
    error: (err) => {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
  });
}




  closeModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'none';
    this.close.emit();
    // Clear fields
    this.selectedFile = null;
    this.selectedWorkspaceId = '';
    (document.getElementById('uploadFile') as HTMLInputElement).value = '';
  }
}
