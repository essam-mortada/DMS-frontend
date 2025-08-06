import { Component, ElementRef, Input, input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { SearchService } from '../services/search-service';
import { AudioTranscriptButtonComponent } from "../audio-transcript-btn/audio-transcript-btn";

declare var bootstrap: any;
@Component({
  selector: 'app-workspace-details',
   imports: [CommonModule, RouterModule, FolderBreadcrumbs, FolderList, DocumentList, DocumentUploadComponent, Header, AudioTranscriptButtonComponent],

  templateUrl: './workspace-details.html',
  styleUrl: './workspace-details.css'
})
export class WorkspaceDetails implements OnInit, OnDestroy {
  showUploadModal: boolean = false;
  @Input() searchQuery: string = '';

    @ViewChild('createFolderModal') createFolderModal!: ElementRef;
    @ViewChild('createDocumentModal') createDocumentModal!: ElementRef;

  workspaceId!: string;
  currentFolderId: string | null = null;
  workspace!: Workspace;
  folderPath: Folder[] = [];
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
    private themeService: ThemeService,
        private searchService: SearchService
  ) {}



  ngOnInit(): void {

    this.subscription.add(
      this.searchService.searchTerm$.subscribe(term => {
        this.searchQuery = term;
      })
    );
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
    // this.getDocuments();
    // this.refreshDocuments();

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
