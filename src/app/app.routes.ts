import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { WorkspaceList } from './workspace-list/workspace-list';
import { AuthGuard } from './services/auth.guard';
import { Dashboard } from './dashboard/dashboard';
import { DashboardRedirect } from './dashboard-redirect/dashboard-redirect';
import { FolderList } from './folder-list/folder-list';
import { WorkspaceDetails } from './workspace-details/workspace-details';
import { DocumentPreview } from './document-preview/document-preview';
import { FolderDetails } from './folder-details/folder-details';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '', component: DashboardRedirect ,
    pathMatch: 'full',
    canActivate: [AuthGuard],

  },

  {
    path: 'workspaces',
    canActivate: [AuthGuard],
    component: WorkspaceList,
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    component: Dashboard,
  },
  {
    path: 'workspaces/:workspaceId',
    canActivate: [AuthGuard],
    component: WorkspaceDetails
  },
  {
    path: 'workspaces/:workspaceId/folders/:folderId',
    canActivate: [AuthGuard],
    component: FolderList
  }
  ,
  {
    path: 'preview/:documentId',
    canActivate: [AuthGuard],
    component: DocumentPreview
  },
{
  path:'folders/:folderId',
  canActivate: [AuthGuard],
  component: FolderDetails
}
];
