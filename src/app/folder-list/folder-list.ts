import { Component, input, Input, OnInit } from '@angular/core';
import { Folder } from '../models/folder.model';
import { FolderService } from '../services/folder-service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FolderBreadcrumbs } from "../folder-breadcrumbs/folder-breadcrumbs";
import { FolderCreateModal } from "../folder-create-modal/folder-create-modal";
import { DocumentUploadComponent } from '../upload-modal/upload-modal';

import { ShareModal } from '../share-modal/share-modal';
import { SharingService } from '../services/sharing';
import { SharePermission } from '../models/share-permission.model';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-folder-list',
  imports: [CommonModule, RouterModule, FolderCreateModal, ShareModal],
  templateUrl: './folder-list.html',
  styleUrl: './folder-list.css'
})
export class FolderList implements OnInit {
@Input() set workspaceId(id: string) {
  if (id) {
    this._workspaceId = id;
    this.loadFolders();
  }
}
private _workspaceId!: string;

get workspaceId(): string {
  return this._workspaceId;
}
  @Input() parentFolderId: string | null = null;

  folders: Folder[] = [];
  loading = false;
  openDropdownId: string | null = null;
 showCreateModal = false;
  showEditModal = false;
 @Input() selectedFolder: any = null;
 showShareModal = false;
  currentShareLink = '';
  selectedFolderForSharing: Folder | null = null;
 constructor(
    private folderService: FolderService,
    private route: ActivatedRoute,
    private router: Router,
    private sharingService: SharingService,
    private snackBar: MatSnackBar
  ) {}
ngOnInit() {
  this.route.params.subscribe(params => {
    this.workspaceId = params['workspaceId'];
    this.loadFolders();
  });
}

loadFolders(): void {
  console.log('Current workspaceId:', this.workspaceId);

  if (!this.workspaceId) {
    console.error('loadFolders() called without workspaceId!');
    console.trace();
    return;
  }

  this.loading = true;
  this.folderService.getFolders(this.workspaceId).subscribe({
    next: (folders) => {
      console.log('Received folders:', folders);
      this.folders = folders;
    },
    error: (err) => {
      console.error('Full error:', err);
      this.snackBar.open('Failed to load folders. Please try again.', 'Dismiss');
    },
    complete: () => this.loading = false
  });
}

  deleteFolder(folderId: string): void {
    if (confirm('Are you sure you want to delete this folder?')) {
      this.folderService.deleteFolder(folderId)
        .subscribe(() => this.loadFolders());
    }
  }



  toggleDropdown(id: string) {
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  closeDropdown() {
    this.openDropdownId = null;
  }



navigateToFolder(folderId: string): void {
    this.router.navigate(["/folders", folderId])
  }

  openEditModal(folder: any) {
    this.selectedFolder = folder;
    this.showEditModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedFolder = null;
  }

  onCreate(folderData: any) {
    this.folderService.createFolder( folderData.name,this.workspaceId)
      .subscribe({
        next: (newFolder) => {
          this.folders.push(newFolder);
          this.closeModals();
        },
        error: (err) => console.error('Creation failed', err)
      });
  }

  onEdit(folderData: any) {
    if (!this.selectedFolder) return;

    this.folderService.updateFolder(
      this.selectedFolder.id,
      folderData.name
    ).subscribe({
      next: (updatedFolder) => {
        const index = this.folders.findIndex(f => f.id === updatedFolder.id);
        if (index !== -1) {
          this.folders[index] = updatedFolder;
        }
        this.closeModals();
      },
      error: (err) => console.error('Update failed', err)
    });
  }

  openCreateModal(parentFolderId: string | null = null) {
  this.parentFolderId = parentFolderId;
  this.showCreateModal = true;
  this.showEditModal = false;
}


handleFolderCreated(folderData: {
  name: string;
  workspaceId: string;
  FolderId: string | null;
}) {
  this.folderService.createFolder(
    folderData.name,
    folderData.workspaceId,
    folderData.FolderId
  ).subscribe({
    next: (newFolder) => {
      this.folders.push(newFolder);
      this.showCreateModal = false;
    },
    error: (err) => console.error('Creation failed', err)
  });
}



openShareModal(folder: Folder): void {
    this.selectedFolderForSharing = folder;
    if (folder.linkSharingEnabled && folder.shareLinkToken) {
      this.currentShareLink = `${window.location.origin}/public/share/${folder.shareLinkToken}`;
      this.showShareModal = true;
    } else {
      this.sharingService.createFolderShareLink(folder.id, SharePermission.VIEW).subscribe({
        next: (token) => {
          const updatedFolder = { ...folder, linkSharingEnabled: true, shareLinkToken: token };
          this.folders = this.folders.map(f => f.id === folder.id ? updatedFolder : f);
          this.currentShareLink = `${window.location.origin}/public/share/${token}`;
          this.showShareModal = true;
          this.snackBar.open('Share link created', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error creating share link:', err);
          this.snackBar.open('Failed to create share link', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.currentShareLink = '';
    this.selectedFolderForSharing = null;
  }

  deleteShareLink(): void {
    if (!this.selectedFolderForSharing) return;

    this.sharingService.deleteFolderShareLink(this.selectedFolderForSharing.id).subscribe({
      next: () => {
        const updatedFolder = { ...this.selectedFolderForSharing!, linkSharingEnabled: false };
        this.folders = this.folders.map(f => f.id === this.selectedFolderForSharing!.id ? updatedFolder : f);
        this.snackBar.open('Share link deleted', 'Close', { duration: 3000 });
        this.closeShareModal();
      },
      error: (err) => {
        console.error('Error deleting share link:', err);
        this.snackBar.open('Failed to delete share link', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }
}


