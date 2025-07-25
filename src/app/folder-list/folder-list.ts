import { Component, input, Input, OnInit } from '@angular/core';
import { Folder } from '../models/folder.model';
import { FolderService } from '../services/folder-service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FolderBreadcrumbs } from "../folder-breadcrumbs/folder-breadcrumbs";
import { FolderCreateModal } from "../folder-create-modal/folder-create-modal";
import { DocumentUploadComponent } from '../upload-modal/upload-modal';

@Component({
  selector: 'app-folder-list',
  imports: [CommonModule, RouterModule, FolderCreateModal],
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
  snackBar: any;
  openDropdownId: string | null = null;
 showCreateModal = false;
  showEditModal = false;
 @Input() selectedFolder: any = null;

  constructor(private folderService: FolderService, private route: ActivatedRoute,private router: Router) {}

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
}


