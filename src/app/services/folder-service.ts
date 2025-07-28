// folder.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Folder } from '../models/folder.model';
import { Document } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private apiUrl = 'http://localhost:8081/api/folders';
  private documentApiUrl = 'http://localhost:8081/api/documents';

  constructor(private http: HttpClient) {}

getFolders(workspaceId: string, parentFolderId: string | null = null): Observable<Folder[]> {
  if (!workspaceId || workspaceId === 'undefined') {
    return throwError(() => new Error('Valid workspaceId is required'));
  }

  const url = `${this.apiUrl}/workspace/${workspaceId}`;
  let params = new HttpParams();

  if (parentFolderId) {
    params = params.set('parentFolderId', parentFolderId);
  }

  return this.http.get<Folder[]>(url, { params }).pipe(
    catchError(err => {
      console.error('API Error:', err);
      return throwError(() => new Error('Failed to load folders'));
    })
  );
}

getFoldersByParent(parentFolderId: string): Observable<Folder[]> {
  return this.http.get<Folder[]>(`${this.apiUrl}/parent/${parentFolderId}`);
}

getFolderDocuments(folderId: string): Observable<Document[]> {
  return this.http.get<Document[]>(`${this.documentApiUrl}/folder/${folderId}/documents`);
}
  createFolder(name: string, workspaceId: string, parentFolderId: string | null = null): Observable<Folder> {
    return this.http.post<Folder>(this.apiUrl, { name, workspaceId, parentFolderId });
  }

  updateFolder(folderId: string, name: string): Observable<Folder> {
    return this.http.put<Folder>(`${this.apiUrl}/${folderId}`, { name });
  }

  deleteFolder(folderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${folderId}`);
  }

  getFolderPath(folderId: string): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.apiUrl}/${folderId}/path`);
}
  getFolderById(folderId: string): Observable<Folder> {
    return this.http.get<Folder>(`${this.apiUrl}/${folderId}`);
  }
}
