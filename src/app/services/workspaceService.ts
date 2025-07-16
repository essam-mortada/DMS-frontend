import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Workspace } from '../models/workspace.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  private apiUrl = 'http://localhost:8081/api/workspaces';


  constructor(private http: HttpClient) {}

   getAll(): Observable<Workspace[]> {
      console.log('Received workspaces:',
        this.http.get<Workspace[]>(this.apiUrl)
      );
    return this.http.get<Workspace[]>(this.apiUrl);
  }
  create(workspace: Workspace): Observable<Workspace> {
    return this.http.post<Workspace>(this.apiUrl, workspace);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  update(id: string, workspace: Partial<Workspace>): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.apiUrl}/${id}`, workspace);
  }

  getById(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.apiUrl}/${id}`);
  }
}
