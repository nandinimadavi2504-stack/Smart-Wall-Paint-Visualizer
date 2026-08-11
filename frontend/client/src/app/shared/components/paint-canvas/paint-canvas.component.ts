import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FloodFillService } from '../../../core/services/flood-fill.service';

import { AiSegmentationService } from '../../../core/services/ai-segmentation.service';

@Component({
  selector: 'app-paint-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paint-canvas.component.html',
  styleUrl: './paint-canvas.component.scss',
})
export class PaintCanvasComponent implements AfterViewInit, OnChanges {
  @Input()
  imageUrl: string | null = null;

  @Input()
  imageFile: File | null = null;

  @Input()
  selectedColor = '#2196f3';

  @Output()
  segmentSelected = new EventEmitter<any>();

  @ViewChild('paintCanvas')
  paintCanvas!: ElementRef<HTMLCanvasElement>;

  mouseX = 0;

  mouseY = 0;

  clickedX = -1;

  clickedY = -1;

  red = 0;

  green = 0;

  blue = 0;

  // Store selected SAM points

  selectedPoints: number[][] = [];

  selectedAISegment: any = null;

  paintStrength = 0.65;

  showSelection = false;

  private viewInitialized = false;

  private undoStack: ImageData[] = [];

  private redoStack: ImageData[] = [];

  constructor(
    private floodFillService: FloodFillService,

    private aiSegmentationService: AiSegmentationService,
  ) {}

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    console.log('Canvas received imageFile:', this.imageFile);

    this.drawImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageFile']) {
      console.log('Canvas imageFile changed:', this.imageFile);
    }

    if (changes['imageUrl'] && this.viewInitialized) {
      this.drawImage();
    }
  }

  private drawImage(): void {
    if (!this.imageUrl || !this.paintCanvas) {
      return;
    }

    const canvas = this.paintCanvas.nativeElement;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const image = new Image();

    image.crossOrigin = 'anonymous';

    image.onload = () => {
      canvas.width = 900;

      canvas.height = 600;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(
        canvas.width / image.width,
        canvas.height / image.height,
      );

      const width = image.width * scale;

      const height = image.height * scale;

      const x = (canvas.width - width) / 2;

      const y = (canvas.height - height) / 2;

      ctx.drawImage(image, x, y, width, height);

      this.saveState();

      console.log('Image Loaded Successfully');
    };

    image.src = this.imageUrl;
  }

  private saveState(): void {
    const canvas = this.paintCanvas.nativeElement;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    this.undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    this.redoStack = [];
  }

  undo(): void {
    if (this.undoStack.length <= 1) {
      return;
    }

    const canvas = this.paintCanvas.nativeElement;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    this.redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    this.undoStack.pop();

    ctx.putImageData(this.undoStack[this.undoStack.length - 1], 0, 0);
  }

  redo(): void {
    if (this.redoStack.length === 0) {
      return;
    }

    const canvas = this.paintCanvas.nativeElement;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const next = this.redoStack.pop();

    if (next) {
      ctx.putImageData(next, 0, 0);
    }
  }
  setAISegment(segment: any): void {
    this.selectedAISegment = segment;

    console.log('Canvas Segment Stored:', this.selectedAISegment);
  }

  onMouseMove(event: MouseEvent): void {
    const canvas = this.paintCanvas.nativeElement;

    const rect = canvas.getBoundingClientRect();

    this.mouseX = Math.round(
      (event.clientX - rect.left) * (canvas.width / rect.width),
    );

    this.mouseY = Math.round(
      (event.clientY - rect.top) * (canvas.height / rect.height),
    );
  }

  // CLICK WALL POINT

  onCanvasClick(event: MouseEvent): void {
    const canvas = this.paintCanvas.nativeElement;

    const rect = canvas.getBoundingClientRect();

    this.clickedX = Math.round(
      (event.clientX - rect.left) * (canvas.width / rect.width),
    );

    this.clickedY = Math.round(
      (event.clientY - rect.top) * (canvas.height / rect.height),
    );

    console.log('Canvas Click:', this.clickedX, this.clickedY);

    if (!this.imageFile) {
      console.log('Image file missing');

      return;
    }

    // store point

    this.selectedPoints.push([this.clickedX, this.clickedY]);

    console.log('Selected Points:', this.selectedPoints);

    this.showSelection = true;

    // IMPORTANT - CALL SAM

    this.generateMultiPointMask();
  }

  generateMultiPointMask(): void {
    if (!this.imageFile) {
      console.log('Image missing');

      return;
    }

    if (this.selectedPoints.length === 0) {
      console.log('No points selected');

      return;
    }

    console.log('Sending Points:', this.selectedPoints);

    this.aiSegmentationService
      .segmentMultiplePoints(this.imageFile, this.selectedPoints)
      .subscribe({
        next: (response: any) => {
          console.log('MULTI SAM RESPONSE:', response);

          this.selectedAISegment = response;

          console.log('AI Segment Stored:', this.selectedAISegment);

          this.segmentSelected.emit(response);
        },

        error: (error) => {
          console.error('SAM ERROR:', error);
        },
      });
  }

  setPaintStrength(value: number): void {
    this.paintStrength = value;

    this.floodFillService.setPaintStrength(value);

    console.log('Paint Strength:', this.paintStrength);
  }

  applyCurrentPaint(): void {
    console.log('Apply Current Paint Segment:', this.selectedAISegment);

    if (!this.selectedAISegment) {
      console.log('Select AI Object First');

      return;
    }

    this.applyAIPaint();
  }

  private applyAIPaint(): void {
    const canvas = this.paintCanvas.nativeElement;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const color = this.hexToRgb(this.selectedColor);

    if (!color) {
      return;
    }

    const mask = this.selectedAISegment.mask;

    if (!mask) {
      console.log('Mask missing');

      return;
    }

    this.saveState();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const data = imageData.data;

    const scaleX = canvas.width / mask[0].length;

    const scaleY = canvas.height / mask.length;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const mx = Math.floor(x / scaleX);

        const my = Math.floor(y / scaleY);

        if (mask[my] && mask[my][mx] === 1) {
          const index = (y * canvas.width + x) * 4;

          const opacity = this.paintStrength;

          data[index] = data[index] * (1 - opacity) + color.r * opacity;

          data[index + 1] = data[index + 1] * (1 - opacity) + color.g * opacity;

          data[index + 2] = data[index + 2] * (1 - opacity) + color.b * opacity;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    console.log('Paint Applied');
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result
      ? {
          r: parseInt(result[1], 16),

          g: parseInt(result[2], 16),

          b: parseInt(result[3], 16),
        }
      : null;
  }

  saveCanvas(): string | null {
    if (!this.paintCanvas) {
      return null;
    }

    return this.paintCanvas.nativeElement.toDataURL('image/png');
  }

  resetCanvas(): void {
    console.log('Canvas Reset');

    this.selectedAISegment = null;

    this.selectedPoints = [];

    this.clickedX = -1;

    this.clickedY = -1;

    this.drawImage();
  }
}
