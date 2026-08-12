import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly API_URL =
    'https://smart-wall-paint-visualizer-1.onrender.com/api/auth';
  private readonly TOKEN_KEY = 'jwt_token';

  constructor() {}

  // Register User
  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  // Login User
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credentials);
  }

  // Save JWT Token
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Get JWT Token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Check Login Status
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Logout User
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
