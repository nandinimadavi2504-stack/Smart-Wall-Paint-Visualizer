import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';

  constructor() {}

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
    return this.getToken() !== null;
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
