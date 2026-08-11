import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageStateService {
  private imageUrl: string | null = null;

  private imageFile: File | null = null;

  private segmentationData: any = null;

  setImage(url: string): void {
    this.imageUrl = url;

    localStorage.setItem('uploadedImage', url);

    console.log('Image Saved:', url);
  }

  getImage(): string | null {
    if (this.imageUrl) {
      console.log('Image From Memory:', this.imageUrl);

      return this.imageUrl;
    }

    const storedImage = localStorage.getItem('uploadedImage');

    console.log('Image From LocalStorage:', storedImage);

    return storedImage;
  }

  // ==========================
  // IMAGE FILE STORAGE
  // ==========================

  setFile(file: File): void {
    this.imageFile = file;

    console.log('Image File Saved:', file.name);
  }

  getFile(): File | null {
    console.log('Image File Retrieved:', this.imageFile);

    return this.imageFile;
  }

  setSegmentation(data: any): void {
    this.segmentationData = data;

    localStorage.setItem('segmentationData', JSON.stringify(data));

    console.log('Segmentation Saved:', data);
  }

  getSegmentation(): any {
    if (this.segmentationData) {
      console.log('Segmentation From Memory:', this.segmentationData);

      return this.segmentationData;
    }

    const stored = localStorage.getItem('segmentationData');

    if (stored) {
      this.segmentationData = JSON.parse(stored);
    }

    console.log('Segmentation From Storage:', this.segmentationData);

    return this.segmentationData;
  }

  getSegments(): any[] {
    const data = this.getSegmentation();

    if (data && data.segments) {
      return data.segments;
    }

    return [];
  }

  getSegmentById(id: number): any {
    const segments = this.getSegments();

    return segments.find((segment) => segment.id === id);
  }

  clearImage(): void {
    this.imageUrl = null;

    this.imageFile = null;

    this.segmentationData = null;

    localStorage.removeItem('uploadedImage');

    localStorage.removeItem('segmentationData');

    console.log('Image and Segmentation Cleared');
  }
}
