import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Folder } from '../models/folder.model';

@Component({
  selector: 'app-folder-breadcrumbs',
  imports: [CommonModule, RouterModule],
  templateUrl: './folder-breadcrumbs.html',
  styleUrl: './folder-breadcrumbs.css'
})
export class FolderBreadcrumbs {
  @Input() workspaceId!: string;
  @Input() folderPath: Folder[] = [];
}
