import { Component, OnInit, ViewChild } from '@angular/core';
import { WorkspaceList } from '../workspace-list/workspace-list';
import { CreateWorkspaceModal } from '../create-workspace-modal/create-workspace-modal';
import { Header } from '../header/header';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../services/workspaceService';
import { Workspace } from '../models/workspace.model';
import { UploadModal } from '../upload-modal/upload-modal';

@Component({
  selector: 'app-dashboard',
  imports: [WorkspaceList, CreateWorkspaceModal, UploadModal ,Header, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  workspaces: Workspace[] = [];
  showCreateWorkspaceModal = false;
  showUploadModal = false;
  @ViewChild('workspaceList') workspaceList!: WorkspaceList;

  constructor(private workspaceService: WorkspaceService) {}

 ngOnInit() {
    this.loadWorkspaces();
  }

    loadWorkspaces() {
    this.workspaceService.getAll().subscribe((data: Workspace[]) => {
      this.workspaces = data;
    });
  }

activeTab:any = 'dashboard';

  setTab(tab: 'dashboard' | 'workspaces' | 'documents') {
    this.activeTab = tab;
  }


   openCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = true;
  }

  closeCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = false;
    this.loadWorkspaces();
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

}

