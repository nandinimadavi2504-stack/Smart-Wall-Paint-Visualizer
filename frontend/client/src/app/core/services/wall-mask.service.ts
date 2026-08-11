import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WallMaskService {
  createMask(imageData: ImageData, startX: number, startY: number): Uint8Array {
    const width = imageData.width;

    const height = imageData.height;

    const data = imageData.data;

    const mask = new Uint8Array(width * height);

    const visited = new Uint8Array(width * height);

    const startIndex = (startY * width + startX) * 4;

    const targetR = data[startIndex];

    const targetG = data[startIndex + 1];

    const targetB = data[startIndex + 2];

    const queue: number[][] = [];

    queue.push([startX, startY]);

    const tolerance = 30;

    const edgeThreshold = 140;

    let pixelCount = 0;

    const maxPixels = width * height * 0.25;

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

      const index = pixelIndex * 4;

      const r = data[index];

      const g = data[index + 1];

      const b = data[index + 2];

      const difference =
        Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);

      if (difference > tolerance * 3) {
        continue;
      }

      // Stop at strong edges

      if (this.isEdge(data, width, height, x, y, edgeThreshold)) {
        continue;
      }

      mask[pixelIndex] = 1;

      pixelCount++;

      if (pixelCount > maxPixels) {
        break;
      }

      queue.push([x + 1, y]);

      queue.push([x - 1, y]);

      queue.push([x, y + 1]);

      queue.push([x, y - 1]);
    }

    console.log('Wall Pixels Detected:', pixelCount);

    return mask;
  }

  private isEdge(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    threshold: number,
  ): boolean {
    const current = this.getBrightness(data, width, x, y);

    const neighbours = [
      [x + 1, y],

      [x - 1, y],

      [x, y + 1],

      [x, y - 1],
    ];

    for (const [nx, ny] of neighbours) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }

      const neighbour = this.getBrightness(data, width, nx, ny);

      if (Math.abs(current - neighbour) > threshold) {
        return true;
      }
    }

    return false;
  }

  private getBrightness(
    data: Uint8ClampedArray,
    width: number,
    x: number,
    y: number,
  ): number {
    const index = (y * width + x) * 4;

    return (data[index] + data[index + 1] + data[index + 2]) / 3;
  }
}
