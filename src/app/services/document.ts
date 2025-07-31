import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Document } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private baseUrl = 'http://localhost:8081/api/documents';
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  documents$ = this.documentsSubject.asObservable();

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

    return this.http.post<Document>(`${this.baseUrl}/upload`, formData).pipe(
      tap(() => {
        // After upload, refresh the list of documents
        if (folderId) {
          this.fetchDocumentsByFolder(folderId);
        } else if (workspaceId) {
          this.fetchDocumentsByWorkspace(workspaceId);
        } else {
          this.fetchDocumentsByUser();
        }
      })
    );
  }

  fetchDocumentsByWorkspace(workspaceId: string): void {
    this.http.get<Document[]>(`${this.baseUrl}/workspaces/${workspaceId}/documents`)
      .subscribe(documents => this.documentsSubject.next(documents));
  }

  fetchDocumentsByUser(): void {
    this.http.get<Document[]>(`${this.baseUrl}/users/documents`)
      .subscribe(documents => this.documentsSubject.next(documents));
  }

  fetchDocumentsByFolder(folderId: string): void {
    // This endpoint does not exist in the original file, assuming it should be added to folderService
    // For now, I will just clear the documents list.
    // A proper implementation would require a new endpoint or using folderService.
    console.warn("fetchDocumentsByFolder is not fully implemented in DocumentService");
    this.documentsSubject.next([]);
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
