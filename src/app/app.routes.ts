import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { WorkspaceList } from './workspace-list/workspace-list';
import { AuthGuard } from './services/auth.guard';
import { Dashboard } from './dashboard/dashboard';
import { DashboardRedirect } from './dashboard-redirect/dashboard-redirect';
import { FolderList } from './folder-list/folder-list';

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
    component: FolderList
  },
  {
    path: 'workspaces/:workspaceId/folders/:folderId',
    canActivate: [AuthGuard],
    component: FolderList
  }
];
