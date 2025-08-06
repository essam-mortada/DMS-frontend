import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Document } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private baseUrl = 'http://localhost:8081/api/documents';
  private publicShareUrl = 'http://localhost:8081/public/share';

  private documentsSubject = new BehaviorSubject<Document[]>([]);
  documents$ = this.documentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  upload(
    file: File,
    workspaceId: string,
    folderId: string | null = null
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const meta = {
      name: file.name,
      type: file.type,
      workspaceId: workspaceId,
      folderId: folderId,
    };
    const metaBlob = new Blob([JSON.stringify(meta)], {
      type: 'application/json',
    });
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

  fetchDocumentsByWorkspace(
    workspaceId: string,
    sort?: string,
    keyword?: string
  ): void {
    let request$: Observable<Document[]>;
    if (keyword) {
      request$ = this.getRequest(
        `${this.baseUrl}/workspace/${workspaceId}/search`,
        new HttpParams().set('keyword', keyword)
      );
    } else if (sort) {
      request$ = this.getRequest(
        `${this.baseUrl}/sort`,
        new HttpParams().set('workspaceId', workspaceId).set('sort', sort)
      );
    } else {
      request$ = this.getRequest(
        `${this.baseUrl}/workspaces/${workspaceId}/documents`,
        new HttpParams()
      );
    }
    request$.subscribe((documents) => this.documentsSubject.next(documents));
  }

  fetchDocumentsByUser(sort?: string, keyword?: string): void {
    let request$: Observable<Document[]>;
    if (keyword) {
      request$ = this.getRequest(
        `${this.baseUrl}/search`,
        new HttpParams().set('keyword', keyword)
      );
    } else if (sort) {
      request$ = this.getRequest(
        `${this.baseUrl}/user/sort`,
        new HttpParams().set('sort', sort)
      );
    } else {
      request$ = this.getRequest(
        `${this.baseUrl}/users/documents`,
        new HttpParams()
      );
    }
    request$.subscribe((documents) => this.documentsSubject.next(documents));
  }

  fetchDocumentsByFolder(
    folderId: string,
    sort?: string,
    keyword?: string
  ): void {
    let request$: Observable<Document[]>;
    if (keyword) {
      request$ = this.getRequest(
        `${this.baseUrl}/folder/${folderId}/search`,
        new HttpParams().set('keyword', keyword)
      );
    } else if (sort) {
      request$ = this.getRequest(
        `${this.baseUrl}/folder/${folderId}/sort`,
        new HttpParams().set('folderId', folderId).set('sort', sort)
      );
    } else {
      request$ = this.getRequest(
        `${this.baseUrl}/folder/${folderId}/documents`,
        new HttpParams()
      );
    }
    request$.subscribe((documents) => this.documentsSubject.next(documents));
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, {
      responseType: 'blob',
    });
  }

  preview(id: string) {
    return this.http.get(`${this.baseUrl}/preview/${id}`, {
      responseType: 'text',
    });
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

  publicPreview(token: string): Observable<Blob> {
    return this.http.get(`${this.publicShareUrl}/preview/${token}`, {
      responseType: 'blob',
    });
  }

  publicDownload(token: string): Observable<Blob> {
    return this.http.get(`${this.publicShareUrl}/download/${token}`, {
      responseType: 'blob',
    });
  }

  getDeletedDocuments(): Observable<Document[]> {
    return this.http.get<any[]>(`${this.baseUrl}/recycle-bin`).pipe(
      map((documents) =>
        documents.map(
          (doc) =>
            ({
              id: doc.id,
              name: doc.name,
              type: doc.type,
              url: doc.url,
              ownerNid: doc.owner_nid,
              workspaceId: doc.workspace_id,
              folderId: doc.folder_id,
              size: doc.size,
              tags: doc.tags,
              createdAt: doc.created_at,
              updatedAt: doc.updated_at,
              linkSharingEnabled: doc.link_sharing_enabled,
              shareLinkPermission: doc.share_link_permission,
              shareLinkToken: doc.share_link_token,
            } as Document)
        )
      )
    );
  }

  restoreDocument(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/restore`, {});
  }

 summarizeDocument(documentId: string): Observable<string> {
  return this.http.get(`${this.baseUrl}/${documentId}/summarize`, {
    responseType: 'text',
  });
}

}
