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
import { SearchService } from '../services/search-service';
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
    private searchService:SearchService

  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
this.subscription.add(
      this.searchService.searchTerm$.subscribe(term => {
        this.searchQuery = term;
      })
    );
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

  closeUploadModal() {
    this.showUploadModal = false;
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
