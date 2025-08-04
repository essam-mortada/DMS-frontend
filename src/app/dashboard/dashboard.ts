import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WorkspaceList } from '../workspace-list/workspace-list';
import { CreateWorkspaceModal } from '../create-workspace-modal/create-workspace-modal';
import { Header } from '../header/header';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../services/workspaceService';
import { DocumentService } from '../services/document';
import { Workspace } from '../models/workspace.model';
import { DocumentUploadComponent } from '../upload-modal/upload-modal';
import { Document } from '../models/document.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search-service';
import { DocumentList } from '../document-list/document-list';

// ... all imports remain unchanged ...

@Component({
  selector: 'app-dashboard',
  imports: [WorkspaceList, CreateWorkspaceModal, DocumentUploadComponent, CommonModule, RouterModule, FormsModule, Header, DocumentList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  workspaces: Workspace[] = [];
  documents: Document[] = [];
  showCreateWorkspaceModal = false;
  showUploadModal = false;
  isDarkMode = false;
  searchQuery: string = '';
  @ViewChild('workspaceList') workspaceList!: WorkspaceList;
  @ViewChild('DocumentList') documentListRef?: DocumentList;

  authService = inject(AuthService);
  private subscription: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private workspaceService: WorkspaceService,
    private snackBar: MatSnackBar,
    private router: Router,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private documentService: DocumentService
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.subscription.add(
      this.searchService.searchTerm$.subscribe(term => {
        this.searchQuery = term;
      })
    );
    this.subscription.add(
      this.themeService.darkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark;
        console.log("Theme changed to:", isDark ? "dark" : "light");
      })
    );
    this.subscription.add(
      this.documentService.documents$.subscribe(documents => {
        // fallback type to empty string to avoid .includes on null
        this.documents = documents.map(doc => ({
          ...doc,
          type: doc.type || ''
        }));
      })
    );
    this.loadWorkspaces();
    this.documentService.fetchDocumentsByUser();
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

  openUploadModal() {
    this.showUploadModal = true;
    this.snackBar.open('Preparing upload...', undefined, { duration: 1500 });
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.searchService.updateSearchTerm(this.searchQuery);
  }

  getPDFCount(): number {
    return this.documents.filter(doc => doc.type?.includes('pdf')).length;
  }

  getWordCount(): number {
    return this.documents.filter(doc =>
      doc.type?.includes('word') || doc.type?.includes('document')
    ).length;
  }

  getImageCount(): number {
    return this.documents.filter(doc => doc.type?.includes('image')).length;
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

  getFileIconClass(type: string | null | undefined): string {
    if (!type) return 'fa-file';
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('word')) return 'fa-file-word';
    if (type.includes('excel')) return 'fa-file-excel';
    if (type.includes('image')) return 'fa-image';
    if (type.includes('audio')) return 'fa-music';
    return 'fa-file';
  }

  getFileType(fileType: string | null | undefined): string {
    if (!fileType) return 'File';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('audio')) return 'Music';
    return 'File';
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
