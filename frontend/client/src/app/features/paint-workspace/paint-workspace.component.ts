import { Component, OnInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ImageStateService } from '../../core/services/image-state.service';

import { PaintCanvasComponent } from '../../shared/components/paint-canvas/paint-canvas.component';

@Component({
  selector: 'app-paint-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, PaintCanvasComponent],
  templateUrl: './paint-workspace.component.html',
  styleUrl: './paint-workspace.component.scss',
})
export class PaintWorkspaceComponent implements OnInit {
  @ViewChild('canvasComponent')
  canvasComponent!: PaintCanvasComponent;

  uploadedImage: string | null = null;

  imageFile: File | null = null;

  segmentationData: any = null;

  selectedSegment: any = null;

  selectedColor = '#2196f3';

  paintStrength = 0.65;

  constructor(private imageStateService: ImageStateService) {}

  ngOnInit(): void {
    this.uploadedImage = this.imageStateService.getImage();

    this.imageFile = this.imageStateService.getFile();

    this.segmentationData = this.imageStateService.getSegmentation();

    console.log('Paint Workspace Image:', this.uploadedImage);

    console.log('Paint Workspace File:', this.imageFile);

    console.log('Segmentation Data:', this.segmentationData);
  }

  // Receive SAM mask

  onSegmentSelected(segment: any): void {
    this.selectedSegment = segment;

    console.log('Workspace Received SAM Segment:', segment);

    if (this.canvasComponent) {
      this.canvasComponent.setAISegment(segment);
    }
  }

  // Extra receiver if HTML uses receiveSegment

  receiveSegment(segment: any): void {
    console.log('Workspace Received Segment:', segment);

    this.selectedSegment = segment;

    if (this.canvasComponent) {
      this.canvasComponent.setAISegment(segment);
    }
  }

  updatePaintStrength(): void {
    if (this.canvasComponent) {
      this.canvasComponent.setPaintStrength(this.paintStrength);
    }
  }

  applyPaint(): void {
    console.log('Apply Paint Clicked');

    if (this.canvasComponent) {
      this.canvasComponent.applyCurrentPaint();
    }
  }

  resetPaint(): void {
    console.log('Reset Paint');

    if (this.canvasComponent) {
      this.canvasComponent.resetCanvas();
    }

    this.selectedSegment = null;
  }

  undo(): void {
    if (this.canvasComponent) {
      this.canvasComponent.undo();
    }
  }

  redo(): void {
    if (this.canvasComponent) {
      this.canvasComponent.redo();
    }
  }

  saveDesign(): void {
    if (!this.canvasComponent) {
      return;
    }

    const image = this.canvasComponent.saveCanvas();

    if (image) {
      const link = document.createElement('a');

      link.href = image;

      link.download = 'smart-wall-painted-design.png';

      link.click();

      console.log('Design Saved');
    }
  }
}
