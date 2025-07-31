import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FolderService } from '../services/folder-service';
import { Folder } from '../models/folder.model';
import { catchError, finalize, of, Subscription } from 'rxjs';
import { FolderCreateModal } from '../folder-create-modal/folder-create-modal';
import { ThemeService } from '../services/theme.service';
import { FormsModule } from '@angular/forms';
import { DocumentUploadComponent } from '../upload-modal/upload-modal';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentList } from '../document-list/document-list';
import { Header } from "../header/header";
import { DocumentService } from '../services/document';
type DocumentUploadEvent = {
  status: 'success' | 'error';
  document?: Document;
  error?: any;
};

type DocumentEvent = Document | { id: string | undefined };
@Component({
  selector: 'app-folder-details',
  standalone: true,
  imports: [
    CommonModule,
    FolderCreateModal,
    FormsModule,
    RouterModule,
    DocumentUploadComponent,
    DocumentList,
    Header
],
  templateUrl: './folder-details.html',
  styleUrls: ['./folder-details.css'],
})
export class FolderDetails implements OnInit, OnChanges {
  currentFolderId: string = '';
  parentFolder: Folder | null = null;
  FolderId: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  childFolders: Folder[] = [];
  showCreateModal: boolean = false;
  folders: any;
  isDarkMode = false;
  private subscription: Subscription = new Subscription();
  showEditModal = false;
  editFolderData: Folder | null = null;
  openDropdownId: string | null = null;
  @Input() currentFolder: Folder | null = null;
  @Input() documentCount = 0;
  @Input() workspaceId!: string;
  @Input() searchQuery: string = '';
  showUploadModal: boolean = false;

  private resetUIState(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.openDropdownId = null;
    this.error = null;
  }

  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private themeService: ThemeService,
    private router: Router,
    private snackBar: MatSnackBar
    , private documentService: DocumentService,

  ) {}

  ngOnInit(): void {

    this.route.params.subscribe((params) => {
      this.currentFolderId = params['folderId'] || '';
      this.workspaceId = params['workspaceId'] || '';
      if (!this.currentFolderId) {
        this.snackBar.open('No folder selected', 'Dismiss', { duration: 3000 });
        return;
      }
      this.isLoading = true;
      this.loadCurrentFolder();
      this.loadChildFolders();
      this.resetUIState();
    });
    this.subscription.add(
      this.themeService.darkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark;
        console.log('Theme changed to:', isDark ? 'dark' : 'light');
      })
    );
    this.currentFolderId = this.route.snapshot.paramMap.get('folderId') || '';
     this.loadChildFolders();
    this.loadCurrentFolder();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const documents = changes['documentCount']?.currentValue;
    if(documents){
      this.getDocuments();
      this.refreshDocuments();
    }
  }

  loadCurrentFolder(): void {
    if (!this.currentFolderId) return;

    this.isLoading = true;
    this.folderService
      .getFolderById(this.currentFolderId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (folder) => {
          this.currentFolder = folder;
          this.currentFolderId = folder.id;
          this.workspaceId = folder.workspaceId;
        },
        error: (err) => {
          console.error('Error loading folder:', err);
          this.error = 'Failed to load folder details';
        },
      });
  }

  loadChildFolders(): void {
    if (!this.currentFolderId) return;

    this.folderService
      .getFoldersByParent(this.currentFolderId)
      .pipe(
        catchError((err) => {
          console.error('Failed to load subfolders:', err);
          this.error = 'Error loading subfolders';
          return of([]);
        })
      )
      .subscribe((folders) => {
        this.childFolders = folders;
      });
  }
  navigateToParent(): void {
    if (this.parentFolder) {
      window.location.href = `/folders/${this.parentFolder.id}`;
    }
  }

  openCreateModal(FolderId: string | null = this.currentFolderId) {
    this.FolderId = this.currentFolderId;
    this.showCreateModal = true;
  }

  handleFolderCreated(folderData: { name: string; FolderId: string | null }) {
    this.folderService
      .createFolder(
        folderData.name,
        this.workspaceId,
       this.FolderId
      )
      .subscribe({
        next: (newFolder) => {
          this.childFolders.push(newFolder);
          this.showCreateModal = false;
        },
        error: (err) => console.error('Creation failed', err),
      });

  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  navigateToFolder(folderId: string): void {
    this.router.navigate(['/folders', folderId]);
  }

  toggleDropdown(folderId: string): void {
    this.openDropdownId = this.openDropdownId === folderId ? null : folderId;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  editFolder(folder: Folder): void {
    this.editFolderData = { ...folder };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editFolderData = null;
  }

  saveFolder(): void {
    if (!this.editFolderData || !this.editFolderData.id) {
      console.error('No folder selected for editing');
      return;
    }

    this.folderService
      .updateFolder(this.editFolderData.id, this.editFolderData.name)
      .subscribe({
        next: (updatedFolder) => {
          const index = this.childFolders.findIndex(
            (f) => f.id === updatedFolder.id
          );
          if (index !== -1) {
            this.childFolders[index] = updatedFolder;
          }
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Failed to update folder:', err);
          this.error = 'Failed to update folder';
          this.closeEditModal();
        },
      });
  }

  deleteFolder(folderId: string): void {
    if (
      confirm(
        'Are you sure you want to delete this folder? This action cannot be undone.'
      )
    ) {
      this.childFolders = this.childFolders.filter((f) => f.id !== folderId);
    }
  }

  trackByFolderId(index: number, folder: Folder): string {
    return folder.id;
  }

  openUploadModal(): void {
    this.showUploadModal = true;
    this.snackBar.open('Preparing upload...', undefined, { duration: 1500 });
  }

  onDocumentUploaded(event: any): void {
    // If event is a custom event, extract the document
    if (event && event.status === 'success' && event.document) {
      this.onDocumentAdded(event.document);
      this.snackBar.open('Document uploaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } else if (event && event.status === 'error') {
      this.snackBar.open(
        `Upload failed: ${event.error?.message || 'Unknown error'}`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
    this.closeUploadModal();
  }


onDocumentAdded(document: DocumentEvent): void {
  if (!document || !('id' in document) || !document.id) {
    this.snackBar.open('Invalid document event', 'Close', { duration: 3000 });
    return;
  }
  this.documentCount++;
  this.snackBar.open('Document added successfully!', 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
  this.refreshDocuments();
}

 onDocumentDeleted(documentId: string): void {
  this.documentCount = Math.max(0, this.documentCount - 1);
  this.snackBar.open('Document deleted successfully', 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
  this.refreshDocuments();
}


  // Modified delete document
  deleteDocument(documentId: string): void {
    if (!documentId) {
      this.snackBar.open('Document ID is missing', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    this.snackBar.open('Deleting document...', undefined, { duration: 1500 });

    this.documentService.delete(documentId).subscribe({
      next: () => {
        this.onDocumentDeleted(documentId);
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
  closeUploadModal(success: boolean = false) {
    this.showUploadModal = false;
    if (success) {
      this.snackBar.open('Upload completed successfully!', 'Close', {
        duration: 3000,
      });
      this.refreshDocuments();
    } else {
      this.snackBar.open('Upload cancelled', undefined, { duration: 1500 });
    }
  }

  getDocuments() {
    if (!this.currentFolderId) {
      this.snackBar.open('No folder selected', 'Dismiss', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    this.folderService
      .getFolderDocuments(this.currentFolderId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (documents) => {
          this.documentCount = documents.length;
          this.snackBar.open('Documents loaded successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Failed to load documents:', err);
          this.snackBar.open('Failed to load documents', 'Dismiss', {
            duration: 5000,
          });
        },
      });
  }

  refreshDocuments() {
    //this.loadChildFolders();
    //this.loadCurrentFolder();
    this.getDocuments();
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
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
