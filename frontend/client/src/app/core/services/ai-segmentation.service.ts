import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AiSegmentationService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  segmentImage(file: File) {
    const formData = new FormData();

    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/segment`, formData);
  }

  // OLD SINGLE POINT
  segmentPoint(file: File, x: number, y: number) {
    const formData = new FormData();

    formData.append('file', file);

    formData.append('x', x.toString());

    formData.append('y', y.toString());

    console.log('Sending SAM Point:', x, y);

    return this.http.post(`${this.apiUrl}/segment-point`, formData);
  }

  // MULTI POINT SAM
  segmentMultiplePoints(file: File, points: number[][]) {
    const formData = new FormData();

    formData.append('file', file);

    formData.append('points', JSON.stringify(points));

    console.log('Sending SAM Multiple Points:', points);

    return this.http.post(`${this.apiUrl}/segment-point`, formData);
  }
}
