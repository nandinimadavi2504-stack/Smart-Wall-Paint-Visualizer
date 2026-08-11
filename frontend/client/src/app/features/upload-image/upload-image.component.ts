import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UploadService } from '../../core/services/upload.service';
import { ImageStateService } from '../../core/services/image-state.service';
import { AiSegmentationService } from '../../core/services/ai-segmentation.service';

@Component({
  selector: 'app-upload-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-image.component.html',
  styleUrl: './upload-image.component.scss',
})
export class UploadImageComponent {
  selectedFile: File | null = null;

  previewUrl: string | null = null;

  uploadedImageUrl: string | null = null;

  segmentationResult: any = null;

  errorMessage = '';

  successMessage = '';

  constructor(
    private uploadService: UploadService,

    private imageStateService: ImageStateService,

    private router: Router,

    private aiSegmentationService: AiSegmentationService,
  ) {}

  onFileSelected(event: Event): void {
    this.errorMessage = '';

    this.successMessage = '';

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Only JPG and PNG images are allowed.';

      this.selectedFile = null;

      this.previewUrl = null;

      this.uploadedImageUrl = null;

      return;
    }

    this.selectedFile = file;

    // SAVE FILE FOR SAM

    this.imageStateService.setFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select an image first.';

      return;
    }

    this.uploadService.uploadImage(this.selectedFile).subscribe({
      next: (response) => {
        console.log('UPLOAD RESPONSE:', response);

        this.successMessage = response.message || 'Image uploaded successfully';

        this.uploadedImageUrl = response.imageUrl;

        console.log('IMAGE URL:', this.uploadedImageUrl);

        // AI SEGMENTATION

        this.aiSegmentationService.segmentImage(this.selectedFile!).subscribe({
          next: (aiResponse: any) => {
            console.log(
              'FULL AI RESPONSE:',

              JSON.stringify(aiResponse, null, 2),
            );

            this.segmentationResult = aiResponse;

            this.imageStateService.setSegmentation(aiResponse);
          },

          error: (error: any) => {
            console.error('AI SEGMENTATION ERROR:', error);
          },
        });
      },

      error: (error) => {
        console.error('UPLOAD ERROR:', error);

        this.errorMessage = error.error?.message || 'Image upload failed.';
      },
    });
  }

  continueToPaint(): void {
    console.log('CONTINUE BUTTON CLICKED');

    if (!this.uploadedImageUrl) {
      alert('Please upload an image first.');

      return;
    }

    this.imageStateService.setImage(this.uploadedImageUrl);

    // ensure file exists

    if (this.selectedFile) {
      this.imageStateService.setFile(this.selectedFile);
    }

    console.log('IMAGE AND FILE SAVED');

    this.router.navigate(['/paint-workspace']);
  }
}
