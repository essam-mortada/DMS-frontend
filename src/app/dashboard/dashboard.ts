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
  workspaces: Workspace[] = [];
  showCreateWorkspaceModal = false;
  showUploadModal = false;
  isDarkMode = false
  searchQuery: string = '';
  @ViewChild('workspaceList') workspaceList!: WorkspaceList;
  @ViewChild('DocumentList') documentListRef?: DocumentList;

  authService = inject(AuthService);
  private subscription: Subscription = new Subscription()

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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
