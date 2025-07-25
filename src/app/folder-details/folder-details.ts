import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FolderService } from '../services/folder-service';
import { Folder } from '../models/folder.model';
import { catchError, finalize, of, Subscription } from 'rxjs';
import { FolderCreateModal } from "../folder-create-modal/folder-create-modal";
import { ThemeService } from '../services/theme.service';
import { FormsModule } from '@angular/forms';
import { DocumentUploadComponent } from "../upload-modal/upload-modal";
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentList } from "../document-list/document-list";

@Component({
  selector: 'app-folder-details',
  standalone: true,
  imports: [CommonModule, FolderCreateModal, FormsModule, RouterModule, DocumentUploadComponent, DocumentList],
  templateUrl: './folder-details.html',
  styleUrls: ['./folder-details.css']
})
export class FolderDetails implements OnInit {
  currentFolderId: string = '';
  parentFolder: Folder | null = null;
  FolderId: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  childFolders: Folder[] = [];
  showCreateModal: boolean  = false;
  folders: any;
  isDarkMode = false;
  private subscription: Subscription = new Subscription()
  showEditModal = false
  editFolderData: Folder | null = null
  openDropdownId: string | null = null
  @Input() currentFolder: Folder | null = null
  @Input() documentCount = 0
  @Input() workspaceId!: string;
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
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
    this.currentFolderId = params['folderId'] || '';
    this.workspaceId = params['workspaceId'] || '';
    if (!this.currentFolderId) {
      this.snackBar.open('No folder selected', 'Dismiss', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    this.loadCurrentFolder();
    this.loadChildFolders();
    this.getDocuments();
    this.resetUIState();
  });
    this.subscription.add(
      this.themeService.darkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark
        console.log("Theme changed to:", isDark ? "dark" : "light")
      }),
    )
    this.currentFolderId = this.route.snapshot.paramMap.get('folderId') || '';
    this.loadChildFolders();
    this.loadCurrentFolder();
  }


loadCurrentFolder(): void {
  if (!this.currentFolderId) return;

  this.isLoading = true;
  this.folderService.getFolderById(this.currentFolderId)
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (folder) => {
        this.currentFolder = folder;
        this.workspaceId = folder.workspaceId;
      },
      error: (err) => {
        console.error('Error loading folder:', err);
        this.error = 'Failed to load folder details';
      }
    });
}

loadChildFolders(): void {
  if (!this.currentFolderId) return;

  this.folderService.getFoldersByParent(this.currentFolderId)
    .pipe(
      catchError(err => {
        console.error('Failed to load subfolders:', err);
        this.error = 'Error loading subfolders';
        return of([]);
      })
    )
    .subscribe(folders => {
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


handleFolderCreated(folderData: {
  name: string;
  FolderId: string | null ;
}) {
  this.folderService.createFolder(
    folderData.name,
    this.workspaceId,
    folderData.FolderId!= this.currentFolderId ? folderData.FolderId : null
  ).subscribe({
    next: (newFolder) => {
      this.childFolders.push(newFolder);
      this.showCreateModal = false;
    },
    error: (err) => console.error('Creation failed', err)
  });
}





  closeCreateModal(): void {
    this.showCreateModal = false
  }



  navigateToFolder(folderId: string): void {
    this.router.navigate(["/folders", folderId])
  }

  toggleDropdown(folderId: string): void {
    this.openDropdownId = this.openDropdownId === folderId ? null : folderId
  }

  closeDropdown(): void {
    this.openDropdownId = null
  }

  editFolder(folder: Folder): void {
    this.editFolderData = { ...folder }
    this.showEditModal = true
  }

  closeEditModal(): void {
    this.showEditModal = false
    this.editFolderData = null
  }

  saveFolder(): void {
  if (!this.editFolderData || !this.editFolderData.id) {
    console.error('No folder selected for editing');
    return;
  }

  this.folderService.updateFolder(
    this.editFolderData.id,
    this.editFolderData.name
  ).subscribe({
    next: (updatedFolder) => {
      const index = this.childFolders.findIndex(f => f.id === updatedFolder.id);
      if (index !== -1) {
        this.childFolders[index] = updatedFolder;
      }
      this.closeEditModal();
    },
    error: (err) => {
      console.error('Failed to update folder:', err);
      this.error = 'Failed to update folder';
      this.closeEditModal();
    }
  });
}

  deleteFolder(folderId: string): void {
    if (confirm("Are you sure you want to delete this folder? This action cannot be undone.")) {
      this.childFolders = this.childFolders.filter((f) => f.id !== folderId)
    }
  }



  trackByFolderId(index: number, folder: Folder): string {
    return folder.id
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

  getDocuments() {
    if (!this.currentFolderId) {
      this.snackBar.open('No folder selected', 'Dismiss', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    this.folderService.getFolderDocuments(this.currentFolderId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (documents) => {
          this.documentCount = documents.length;
          this.snackBar.open('Documents loaded successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Failed to load documents:', err);
          this.snackBar.open('Failed to load documents', 'Dismiss', { duration: 5000 });
        }
      });
  }
  refreshDocuments() {
    this.loadChildFolders();
    this.loadCurrentFolder();
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
