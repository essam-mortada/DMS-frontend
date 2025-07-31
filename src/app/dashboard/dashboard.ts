import { ChangeDetectorRef, Component, inject, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { WorkspaceList } from '../workspace-list/workspace-list';
import { CreateWorkspaceModal } from '../create-workspace-modal/create-workspace-modal';
import { Header } from '../header/header';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../services/workspaceService';
import { DocumentService } from '../services/document';
import { Workspace } from '../models/workspace.model';
import { DocumentUploadComponent } from '../upload-modal/upload-modal';
import { HttpClient } from '@angular/common/http';
import { Document } from '../models/document.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ThemeToggleComponent } from "../theme-toggle/theme-toggle";
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search-service';
import { DocumentList } from '../document-list/document-list';

@Component({
  selector: 'app-dashboard',
  imports: [WorkspaceList, CreateWorkspaceModal, DocumentUploadComponent, CommonModule, RouterModule, FormsModule, Header, DocumentList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit,OnChanges ,OnDestroy {
  workspaces: Workspace[] = [];
  documents: Document[] = [];
  showCreateWorkspaceModal = false;
  showUploadModal = false;
  isDarkMode = false
  searchQuery: string = '';
selectedSort: string = 'name';
viewMode: "grid" | "list" = "grid";
showSortDropdown = false;
filteredDocuments: Document[] = [];
refreshTrigger = 0;
  @ViewChild('workspaceList') workspaceList!: WorkspaceList;
  @ViewChild('DocumentList') documentListRef?: DocumentList;

  documentService: DocumentService = new DocumentService(inject(HttpClient));
  authService = inject(AuthService);
  private subscription: Subscription = new Subscription()

  constructor(
    private themeService: ThemeService,
    private workspaceService: WorkspaceService,
    private snackBar: MatSnackBar,
    private router: Router,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
        const documents = changes['filteredDocuments']?.currentValue;
    if(documents){
      this.filterDocuments();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }


  ngOnInit() {
    this.subscription.add(
      this.themeService.darkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark
        console.log("Theme changed to:", isDark ? "dark" : "light")
      }),
    )


    this.loadWorkspaces();
    this.getDocuments();
    this.refreshDocuments();
  }

  loadWorkspaces() {
    this.snackBar.open('Loading workspaces...', undefined, { duration: 2000 });
    this.workspaceService.getAll().subscribe({
      next: (data: Workspace[]) => {
        this.workspaces = data;
        this.snackBar.open('Workspaces loaded successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error loading workspaces:', err);
        this.snackBar.open('Failed to load workspaces', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  activeTab: any = 'dashboard';

  setTab(tab: 'dashboard' | 'workspaces' | 'documents') {
    this.activeTab = tab;
     this.cdr.detectChanges();
    this.snackBar.open(`Switched to ${tab} view`, undefined, { duration: 1500 });
  }

  openCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = true;
    this.snackBar.open('Creating new workspace...', undefined, { duration: 1500 });
  }

  closeCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = false;
    this.loadWorkspaces();
    this.snackBar.open('Workspace created successfully!', 'Close', { duration: 3000 });
  }

  refreshDocuments() {
    this.snackBar.open('Refreshing documents...', undefined, { duration: 1500 });
    this.documentService.getByUser().subscribe({
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
  this.snackBar.open('Loading documents...', undefined, { duration: 1500 });
  this.documentService.getByUser().subscribe({
    next: (data: Document[]) => {
      this.documents = data;
      this.filterDocuments(); // Apply filters after loading
      this.snackBar.open(`${data.length} documents loaded`, 'Close', { duration: 3000 });
    },
    error: (error) => {
      console.error('Error loading documents:', error);
      this.snackBar.open('Failed to load documents', 'Close', {
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




  openUploadModal() {
    this.showUploadModal = true;
    this.snackBar.open('Preparing upload...', undefined, { duration: 1500 });
  }

  closeUploadModal(success: boolean = false) {
    this.showUploadModal = false;
    if (success) {
      this.snackBar.open('Upload completed successfully!', 'Close', { duration: 3000 });
      this.getDocuments();
    } else {
      this.snackBar.open('Upload cancelled', undefined, { duration: 1500 });
    }
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
        this.getDocuments();
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
      'audio/mp3':'audio'
    };
    return extensionMap[mimeType.toLowerCase()] || 'bin';
  }




getFileIconClass(fileType: string): string {
  if (fileType.includes('pdf')) return 'fa-file-pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
  if (fileType.includes('image')) return 'fa-file-image';
  if (fileType.includes('audio')) return 'fa-music';

  return 'fa-file';
}

getFileType(fileType: string): string {
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
  return '';
}

getFileSize(document: any): string {
  if (document.size) {
    const sizeInBytes = document.size;
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    else if (sizeInBytes < 1048576) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    else if (sizeInBytes < 1073741824) return `${(sizeInBytes / 1048576).toFixed(2)} MB`;
    else return `${(sizeInBytes / 1073741824).toFixed(2)} GB`;
  }
  return 'Unknown Size';
}

getWorkspaceName(workspaceId: string): string {
  const workspace = this.workspaces.find(w => w.id === workspaceId);
  return workspace ? workspace.name : 'Unknown';
}

getPDFCount(): number {
  return this.documents.filter(doc => doc.type.includes('pdf')).length;
}

getWordCount(): number {
  return this.documents.filter(doc =>
    doc.type.includes('word') || doc.type.includes('document')
  ).length;
}

getImageCount(): number {
  return this.documents.filter(doc => doc.type.includes('image')).length;
}

getSizeCount(): string {
  if (!this.documents || this.documents.length === 0) return '0 bytes';

  const totalSizeInBytes = this.documents.reduce((total, doc) => total + (doc.size || 0), 0);

  if (totalSizeInBytes >= 1024 ** 3) {
    return (totalSizeInBytes / (1024 ** 3)).toFixed(2) + ' GB';
  } else if (totalSizeInBytes >= 1024 ** 2) {
    return (totalSizeInBytes / (1024 ** 2)).toFixed(2) + ' MB';
  } else if (totalSizeInBytes >= 1024) {
    return (totalSizeInBytes / 1024).toFixed(2) + ' KB';
  } else {
    return totalSizeInBytes + ' bytes';
  }
}

getStorageUsedPercentage(): number {
  if (!this.documents || this.documents.length === 0) return 0;

  const totalSizeInBytes = this.documents.reduce((total, doc) => total + (doc.size || 0), 0);
  const usedGB = totalSizeInBytes / (1024 ** 3);
  const totalGB = 40;

  return Math.min(100, +((usedGB / totalGB) * 100).toFixed(2));
}


getRecentUploadsThisWeek(): number {
  const now = new Date();
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return this.documents.filter(doc => {
    const uploadDate = new Date(doc.updatedAt! || doc.createdAt);
    return uploadDate >= startOfWeek && uploadDate <= now;
  }).length;
}


  onSearch(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.searchQuery = input.value;
  this.searchService.updateSearchTerm(this.searchQuery);
  this.filterDocuments();
}


onDocumentAdded(newDocument: Document): void {
  if (!document || !('id' in document) || !document.id) {
    this.snackBar.open('Invalid document event', 'Close', { duration: 3000 });
    return;
  }
  this.snackBar.open('Document added successfully!', 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
  this.refreshTrigger++; 
}

onDocumentDeleted(documentId: string): void {
  this.documents = this.documents.filter(doc => doc.id !== documentId);
  this.filterDocuments();
  this.snackBar.open('Document deleted successfully', 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
}
toggleSortDropdown(): void {
  this.showSortDropdown = !this.showSortDropdown;
}

selectSort(sortType: string): void {
  this.selectedSort = sortType;
  this.showSortDropdown = false;
  this.filterDocuments();
}

getSortDisplayName(): string {
  const sortNames: { [key: string]: string } = {
    name: "Name (A-Z)",
    namedesc: "Name (Z-A)",
    date: "Date Created",
    size: "File Size",
    type: "File Type",
  };
  return sortNames[this.selectedSort] || "Name (A-Z)";
}

setViewMode(mode: "grid" | "list"): void {
  this.viewMode = mode;
}

private filterDocuments(): void {
  let filtered = [...this.documents];

  // Apply search filter
  if (this.searchQuery) {
    const query = this.searchQuery.toLowerCase();
    filtered = filtered.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      (doc.type && doc.type.toLowerCase().includes(query))
    );
  }

  // Apply sorting
  filtered = this.sortDocuments(filtered);

  this.filteredDocuments = filtered;
}


private sortDocuments(documents: Document[]): Document[] {
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



logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
