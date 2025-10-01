import { nanoid } from "nanoid";
import { createHmac } from "crypto";

export interface WatermarkMetadata {
  watermarkId: string;
  creatorId: string;
  creatorUsername: string;
  timestamp: Date;
  signature: string;
}

export class WatermarkService {
  private readonly secret: string;

  constructor() {
    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET environment variable is required for watermark signing");
    }
    this.secret = process.env.SESSION_SECRET;
  }

  generateWatermarkId(): string {
    return `wm_${nanoid(16)}`;
  }

  createWatermarkMetadata(creatorId: string, creatorUsername: string): WatermarkMetadata {
    const watermarkId = this.generateWatermarkId();
    const timestamp = new Date();
    const signature = this.generateSignature(watermarkId, creatorId, timestamp);

    return {
      watermarkId,
      creatorId,
      creatorUsername,
      timestamp,
      signature,
    };
  }

  private generateSignature(watermarkId: string, creatorId: string, timestamp: Date): string {
    const data = `${watermarkId}:${creatorId}:${timestamp.toISOString()}`;
    const hmac = createHmac('sha256', this.secret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  encodeWatermarkInMetadata(metadata: WatermarkMetadata): string {
    return JSON.stringify({
      id: metadata.watermarkId,
      creator: metadata.creatorId,
      username: metadata.creatorUsername,
      ts: metadata.timestamp.toISOString(),
      sig: metadata.signature,
    });
  }

  decodeWatermarkMetadata(encoded: string): WatermarkMetadata | null {
    try {
      const data = JSON.parse(encoded);
      return {
        watermarkId: data.id,
        creatorId: data.creator,
        creatorUsername: data.username,
        timestamp: new Date(data.ts),
        signature: data.sig,
      };
    } catch (error) {
      console.error("Failed to decode watermark metadata:", error);
      return null;
    }
  }

  verifyWatermark(metadata: WatermarkMetadata): boolean {
    const expectedSignature = this.generateSignature(
      metadata.watermarkId,
      metadata.creatorId,
      metadata.timestamp
    );
    return metadata.signature === expectedSignature;
  }
}

export const watermarkService = new WatermarkService();
