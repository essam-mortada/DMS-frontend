import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CreateWorkspaceModal } from '../create-workspace-modal/create-workspace-modal';
import { Workspace } from '../models/workspace.model';
import { WorkspaceService } from '../services/workspaceService';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [WorkspaceService],
  templateUrl: './workspace-list.html',
  styleUrls: ['./workspace-list.css'],
})
export class WorkspaceList implements OnInit {
  @Input() workspaces: Workspace[] = [];
  openDropdownId: string | null = null;
  editWorkspaceData: Workspace | null = null;
  showEditModal = false;

  constructor(private workspaceService: WorkspaceService, private router:Router) {}

  ngOnInit() {
    this.fetch();
  }

  fetch() {
    this.workspaceService.getAll().subscribe({
      next: (data) => (this.workspaces = data),
      error: () => alert('Failed to load workspaces'),
    });
  }

  openModal() {
    document.getElementById('createWorkspaceModal')?.classList.add('active');
  }

  deleteWorkspace(id: string) {
    if (confirm('Are you sure?')) {
      this.workspaceService.delete(id).subscribe(() => this.fetch());
    }
  }

  toggleDropdown(id: string) {
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  editWorkspace(workspace: Workspace) {
    this.editWorkspaceData = { ...workspace };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editWorkspaceData = null;
  }

  saveWorkspace() {
    if (this.editWorkspaceData && this.editWorkspaceData.id) {
      this.workspaceService
        .update(this.editWorkspaceData.id, this.editWorkspaceData)
        .subscribe(() => {
          this.fetch();
          this.closeEditModal();
        });
    }
  }




  navigateToWorkspace(workspaceId: string | undefined) {
    if (!workspaceId) {
      console.error('Workspace ID is undefined');
      return;
    }
    this.router.navigate(['/workspaces', workspaceId]);
  }
}
