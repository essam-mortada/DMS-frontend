export interface Document {
  id?: string;
  name: string;
  type: string;
  url?: string;
  ownerNid?: string;
  workspaceId: string;
  folderId?: string | null;
  size?: number;
  tags?: string[];
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
