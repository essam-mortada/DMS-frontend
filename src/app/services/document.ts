// src/app/services/document.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Document } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private baseUrl = 'http://localhost:8081/api/documents';
  updateData:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
  constructor(private http: HttpClient) {}

 upload(file: File, workspaceId: string, folderId: string | null = null): Observable<any> {
  const formData = new FormData();

  formData.append('file', file);

  const meta = {
    name: file.name,
    type: file.type,
    workspaceId: workspaceId,
    folderId: folderId
  };

  const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
  formData.append('meta', metaBlob);

  return this.http.post(`${this.baseUrl}/upload`, formData);
}

  getByWorkspace(workspaceId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/workspaces/${workspaceId}/documents`);
  }

  getByUser(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/users/documents`);
  }


  download(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, {
      responseType: 'blob'
    });
  }

  preview(id: string) {
    return this.http.get(`${this.baseUrl}/preview/${id}`, { responseType: 'text' });
  }

  delete(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

 searchDocuments(keyword: string): Observable<Document[]> {
  return this.http.get<Document[]>(`${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}`);
}


searchDocumentsByWorkspace(workspaceId: string, keyword: string) {
  return this.http.get<Document[]>(`${this.baseUrl}/workspace/${workspaceId}/search`, {
    params: { keyword }
  });
}

searchDocumentsByFolder(folderId: string, keyword: string) {
  return this.http.get<Document[]>(`${this.baseUrl}/folder/${folderId}/search`, {
    params: { keyword }
  });
}
  getMetadata(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/${id}/metadata`);
  }

  updateMetadata(id: string, data: Partial<Document>) {
    return this.http.put<Document>(`${this.baseUrl}/${id}/metadata`, data);
  }

getSortedDocuments(workspaceId: string, sort: string) {
  const params = new HttpParams()
    .set('workspaceId', workspaceId)
    .set('sort', sort);

  return this.http.get<Document[]>(`${this.baseUrl}/sort`, { params });
}
}
