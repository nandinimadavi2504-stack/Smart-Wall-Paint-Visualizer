import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl =
    'https://smart-wall-paint-visualizer-1.onrender.com/api/upload';
  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();

    formData.append('roomImage', file);

    return this.http.post(this.apiUrl, formData);
  }
}
