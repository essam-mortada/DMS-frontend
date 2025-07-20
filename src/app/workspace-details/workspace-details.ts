import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
declare var bootstrap: any;
@Component({
  selector: 'app-workspace-details',
  imports: [CommonModule,
    RouterModule,
    FolderBreadcrumbs,
    FolderList,
    FolderCreateModal, Header],
  templateUrl: './workspace-details.html',
  styleUrl: './workspace-details.css'
})
export class WorkspaceDetails {

    @ViewChild('createFolderModal') createFolderModal!: ElementRef;

  workspaceId!: string;
  currentFolderId: string | null = null;
  workspace!: Workspace;
  folderPath: Folder[] = [];
  showCreateFolderModal = false;

  constructor(
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private folderService: FolderService
  ) {}

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.params['workspaceId'];
    this.currentFolderId = this.route.snapshot.params['folderId'] || null;

    this.loadWorkspace();
    this.loadFolderPath();
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
    this.showCreateFolderModal = true;
    setTimeout(() => {
      const modal = new bootstrap.Modal(this.createFolderModal.nativeElement);
      modal.show();
    });
  }

 onCreateFolder(folder: { name: string; workspaceId: string; parentFolderId: string | null }): void {
  this.folderService
    .createFolder(folder.name, folder.workspaceId, folder.parentFolderId)
    .subscribe({
      next: () => {
        this.hideCreateFolderModal();
      },
      error: (err) => console.error('Failed to create folder', err),
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
}
