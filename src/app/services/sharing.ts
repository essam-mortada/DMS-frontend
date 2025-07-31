import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SharePermission } from '../models/share-permission.model';
import { Document } from '../models/document.model';
import { Folder } from '../models/folder.model';

@Injectable({
  providedIn: 'root'
})
export class SharingService {
  private apiUrl = 'http://localhost:8081/api/share-link';
  private publicApiUrl = 'http://localhost:8081/public/share';

  constructor(private http: HttpClient) { }

  createDocumentShareLink(documentId: string, permission: SharePermission): Observable<string> {
    return this.http.post(`${this.apiUrl}/document/${documentId}`, { permission }, { responseType: 'text' });
  }

  deleteDocumentShareLink(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/document/${documentId}`);
  }

  createFolderShareLink(folderId: string, permission: SharePermission): Observable<string> {
    return this.http.post(`${this.apiUrl}/folder/${folderId}`, { permission }, { responseType: 'text' });
  }

  deleteFolderShareLink(folderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/folder/${folderId}`);
  }

  getSharedItem(token: string): Observable<Document | Folder> {
    return this.http.get<Document | Folder>(`${this.publicApiUrl}/${token}`);
  }
}
