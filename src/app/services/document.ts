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

  fetchDocumentsByWorkspace(workspaceId: string, sort?: string, keyword?: string): void {
    let params = new HttpParams();
    if (sort) params = params.set('sort', sort);
    if (keyword) params = params.set('keyword', keyword);

    this.http.get<Document[]>(`${this.baseUrl}/workspaces/${workspaceId}/documents`, { params })
      .subscribe(documents => this.documentsSubject.next(documents));
  }

  fetchDocumentsByUser(sort?: string, keyword?: string): void {
    let params = new HttpParams();
    if (sort) params = params.set('sort', sort);
    if (keyword) params = params.set('keyword', keyword);

    this.http.get<Document[]>(`${this.baseUrl}/users/documents`, { params })
      .subscribe(documents => this.documentsSubject.next(documents));
  }

  fetchDocumentsByFolder(folderId: string, sort?: string, keyword?: string): void {
    let params = new HttpParams();
    if (sort) params = params.set('sort', sort);
    if (keyword) params = params.set('keyword', keyword);

    this.http.get<Document[]>(`${this.baseUrl}/folder/${folderId}/documents`, { params })
      .subscribe(documents => this.documentsSubject.next(documents));
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

  getMetadata(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/${id}/metadata`);
  }

  updateMetadata(id: string, data: Partial<Document>) {
    return this.http.put<Document>(`${this.baseUrl}/${id}/metadata`, data);
  }
}
