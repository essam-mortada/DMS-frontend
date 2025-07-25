import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FolderService } from '../services/folder-service';
import { WorkspaceService } from '../services/workspaceService';
import { Workspace } from '../models/workspace.model';
import { Folder } from '../models/folder.model';
import { CommonModule } from '@angular/common';
import { FolderBreadcrumbs } from '../folder-breadcrumbs/folder-breadcrumbs';
import { FolderList } from '../folder-list/folder-list';
import { DocumentList } from '../document-list/document-list';
import { FolderCreateModal } from '../folder-create-modal/folder-create-modal';
import { Header } from "../header/header";
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentService } from '../services/document';
import { Document } from '../models/document.model';
import { DocumentUploadComponent } from "../upload-modal/upload-modal";
import { ThemeService } from '../services/theme.service';
import { Subscription } from 'rxjs';
declare var bootstrap: any;
@Component({
  selector: 'app-workspace-details',
  imports: [CommonModule,
    RouterModule,
    FolderBreadcrumbs,
    FolderList,
     DocumentList, DocumentUploadComponent],
  templateUrl: './workspace-details.html',
  styleUrl: './workspace-details.css'
})
export class WorkspaceDetails {
  showUploadModal: boolean = false;
onDocumentDeleted() {

  this.getDocuments();
  this.snackBar.open('Document deleted successfully', 'Close', { duration: 3000 });
  this.refreshDocuments();
}

    @ViewChild('createFolderModal') createFolderModal!: ElementRef;
    @ViewChild('createDocumentModal') createDocumentModal!: ElementRef;

  workspaceId!: string;
  currentFolderId: string | null = null;
  workspace!: Workspace;
  folderPath: Folder[] = [];
  documents: Document[] = [];
  showCreateFolderModal = false;
  private subscription: Subscription = new Subscription()
  isDarkMode = false;

  constructor(
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private folderService: FolderService
    , private snackBar: MatSnackBar
    , private documentService: DocumentService,
    private router: Router,
    private themeService: ThemeService
  ) {}



  ngOnInit(): void {
this.subscription.add(
      this.themeService.darkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark
        console.log("Theme changed to:", isDark ? "dark" : "light")
      }),
    )
    this.workspaceId = this.route.snapshot.params['workspaceId'];
    this.currentFolderId = this.route.snapshot.params['folderId'] || null;

    this.loadWorkspace();
    this.loadFolderPath();
    this.getDocuments();
    this.refreshDocuments();

  }

  loadWorkspace(): void {
    this.workspaceService.getWorkspace(this.workspaceId)
      .subscribe(workspace => this.workspace = workspace);
  }

  loadFolderPath(): void {
    if (this.currentFolderId) {
      this.folderService.getFolderPath(this.currentFolderId)
        .subscribe(path => this.folderPath = path);
    } else {
      this.folderPath = [];
    }
  }

 openCreateFolderModal(): void {
  this.snackBar.open('Creating new folder...', undefined, { duration: 1500 });
}



onCreateFolder(folder: { name: string; workspaceId: string; parentFolderId: string | null }): void {
  this.folderService
    .createFolder(folder.name, folder.workspaceId, folder.parentFolderId)
    .subscribe({
      next: () => {
        this.hideCreateFolderModal();
        this.snackBar.open('Folder created successfully!', 'Close', { duration: 3000 });
        // Refresh folder list
        this.loadFolderPath();
      },
      error: (err) => {
        console.error('Failed to create folder', err);
        this.snackBar.open('Failed to create folder', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
}

  hideCreateFolderModal(): void {
    const modal = bootstrap.Modal.getInstance(this.createFolderModal.nativeElement);
    modal?.hide();
    this.showCreateFolderModal = false;
  }

  onFolderDeleted(): void {
    if (this.currentFolderId) {
      this.folderService.getFolderById(this.currentFolderId).subscribe(folder => {
        if (folder.parentFolderId) {
          this.currentFolderId = folder.parentFolderId;
          this.loadFolderPath();
        } else {
          this.currentFolderId = null;
          this.folderPath = [];
        }
      });
    }
  }


   refreshDocuments() {
  console.log('Refreshing documents...');
      this.snackBar.open('Refreshing documents...', undefined, { duration: 1500 });
      this.documentService.getByWorkspace(this.workspaceId).subscribe({
        next: () => {
          this.snackBar.open('Documents refreshed successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error refreshing documents:', err);
          this.snackBar.open('Failed to refresh documents', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }

    getDocuments() {
      console.log('Loading documents for workspace:', this.workspaceId);
    this.snackBar.open('Loading documents...', undefined, { duration: 1500 });
    this.documentService.getByWorkspace(this.workspaceId).subscribe({
      next: (data: Document[]) => {
        this.documents = data;
        console.log(`${data.length} documents loaded`);
      },
      error: (error) => {
        console.error('Error:', error);
        this.snackBar.open('Document load failed', 'Close', { duration: 3000 });
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
          this.saveFile(blob, fileName, documentType);
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

    private saveFile(blob: Blob, fileName: string, mimeType?: string) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }


  deleteDocument(documentId: string) {
  if (!documentId) {
    this.snackBar.open('Document ID is missing', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    return;
  }

  this.snackBar.open(`Deleting document...`, undefined, { duration: 1500 });
  this.documentService.delete(documentId).subscribe({
    next: () => {
      this.snackBar.open('Document deleted successfully', 'Close', { duration: 3000 });
      this.refreshDocuments(); // Force refresh
    },
    error: (err) => {
      console.error('Error deleting document:', err);
      this.snackBar.open('Failed to delete document', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  });
}

 openUploadModal(): void {
  this.showUploadModal = true;
  this.snackBar.open('Preparing upload...', undefined, { duration: 1500 });
}

 onDocumentUploaded() {
  this.closeUploadModal();
  this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
  this.refreshDocuments();
}

  closeUploadModal(success: boolean = false) {
    this.showUploadModal = false;
    if (success) {
      this.snackBar.open('Upload completed successfully!', 'Close', { duration: 3000 });
      this.getDocuments();
    }
    else {
      this.snackBar.open('Upload cancelled', undefined, { duration: 1500 });
    }
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
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/octet-stream': 'bin',
      'application/json': 'json',
      'application/xml': 'xml',
      'application/javascript': 'js',
      'text/css': 'css',
      'text/html': 'html',
      'text/csv': 'csv',
      'text/markdown': 'md',
      'application/x-www-form-urlencoded': 'url',
      'application/rtf': 'rtf',
      'application/x-shockwave-flash': 'swf',
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.oasis.opendocument.presentation': 'odp',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/x-7z-compressed': '7z',
      'application/x-tar': 'tar',
      'application/x-gzip': 'gz',
      'application/x-bzip2': 'bz2',
      'application/x-iso9660-image': 'iso',
      'application/x-font-ttf': 'ttf',
      'application/x-font-opentype': 'otf',
      'application/x-font-woff': 'woff',
      'application/x-font-woff2': 'woff2',
      'application/x-web-app-manifest+json': 'webapp',
      'application/vnd.apple.installer+xml': 'mpkg',
      'application/vnd.android.package-archive': 'apk',
      'application/x-sh': 'sh',
      'application/x-shellscript': 'sh',
      'application/x-csh': 'csh',
      'application/x-perl': 'pl',
    };
    return extensionMap[mimeType.toLowerCase()] || 'bin';
  }

}
