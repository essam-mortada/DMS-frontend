import { SharePermission } from './share-permission.model';

export interface Folder {
  id: string;
  name: string;
  workspaceId: string;
  parentFolderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  linkSharingEnabled?: boolean;
  shareLinkPermission?: SharePermission;
  shareLinkToken?: string;
}
