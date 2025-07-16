import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationRequest } from '../models/authentication-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { AuthenticationResponse } from '../models/authentication-response.model';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth';
  constructor(private http: HttpClient, private router:Router) {}

  login(data: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/login`, data,{
    headers: { 'Content-Type': 'application/json' }
  });
  }

  register(data: RegisterRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/register`, data,{
    headers: { 'Content-Type': 'application/json' }
  });
  }

   logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

   isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
