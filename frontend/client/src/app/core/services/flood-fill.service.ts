import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FloodFillService {
  private readonly tolerance = 25;

  private paintStrength = 0.65;

  setPaintStrength(value: number): void {
    this.paintStrength = value;
  }

  floodFill(
    imageData: ImageData,
    startX: number,
    startY: number,
    fillColor: {
      r: number;
      g: number;
      b: number;
    },
    wallMask?: Uint8Array,
  ): ImageData {
    const width = imageData.width;

    const height = imageData.height;

    const data = imageData.data;

    const startIndex = (startY * width + startX) * 4;

    const targetR = data[startIndex];

    const targetG = data[startIndex + 1];

    const targetB = data[startIndex + 2];

    const visited = new Uint8Array(width * height);

    const queue: number[][] = [];

    queue.push([startX, startY]);

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;

      if (x < 0 || y < 0 || x >= width || y >= height) {
        continue;
      }

      const pixelIndex = y * width + x;

      if (visited[pixelIndex]) {
        continue;
      }

      visited[pixelIndex] = 1;

      // Paint only detected wall pixels

      if (wallMask && wallMask[pixelIndex] !== 1) {
        continue;
      }

      const index = pixelIndex * 4;

      const r = data[index];

      const g = data[index + 1];

      const b = data[index + 2];

      const difference =
        Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);

      if (difference <= this.tolerance * 3) {
        // Texture preserving blend

        data[index] =
          r * (1 - this.paintStrength) + fillColor.r * this.paintStrength;

        data[index + 1] =
          g * (1 - this.paintStrength) + fillColor.g * this.paintStrength;

        data[index + 2] =
          b * (1 - this.paintStrength) + fillColor.b * this.paintStrength;

        queue.push([x + 1, y]);

        queue.push([x - 1, y]);

        queue.push([x, y + 1]);

        queue.push([x, y - 1]);
      }
    }

    return imageData;
  }
}
