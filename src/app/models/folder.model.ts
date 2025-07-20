export interface Folder {
  id: string;
  name: string;
  workspaceId: string;
  parentFolderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
