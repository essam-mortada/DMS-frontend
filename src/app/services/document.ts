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

  private getRequest(url: string, params: HttpParams): Observable<Document[]> {
    return this.http.get<Document[]>(url, { params });
  }

  fetchDocumentsByWorkspace(workspaceId: string, sort?: string, keyword?: string): void {
    let request$: Observable<Document[]>;
    if (keyword) {
      request$ = this.getRequest(`${this.baseUrl}/workspace/${workspaceId}/search`, new HttpParams().set('keyword', keyword));
    } else if (sort) {
      request$ = this.getRequest(`${this.baseUrl}/sort`, new HttpParams().set('workspaceId', workspaceId).set('sort', sort));
    } else {
      request$ = this.getRequest(`${this.baseUrl}/workspaces/${workspaceId}/documents`, new HttpParams());
    }
    request$.subscribe(documents => this.documentsSubject.next(documents));
  }

  fetchDocumentsByUser(sort?: string, keyword?: string): void {
    let request$: Observable<Document[]>;
    if (keyword) {
      request$ = this.getRequest(`${this.baseUrl}/search`, new HttpParams().set('keyword', keyword));
    } else {
      // The backend sort endpoint requires a workspaceId, so we can't sort all user documents.
      // This is a limitation of the backend API.
      // For now, we will just fetch the unsorted list.
      request$ = this.getRequest(`${this.baseUrl}/users/documents`, new HttpParams());
    }
    request$.subscribe(documents => this.documentsSubject.next(documents));
  }

  fetchDocumentsByFolder(folderId: string, sort?: string, keyword?: string): void {
    let request$: Observable<Document[]>;
    if (keyword) {
      request$ = this.getRequest(`${this.baseUrl}/folder/${folderId}/search`, new HttpParams().set('keyword', keyword));
    } else {
      // The backend does not support sorting within a folder.
      // This is a limitation of the backend API.
      request$ = this.getRequest(`${this.baseUrl}/folder/${folderId}/documents`, new HttpParams());
    }
    request$.subscribe(documents => this.documentsSubject.next(documents));
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
