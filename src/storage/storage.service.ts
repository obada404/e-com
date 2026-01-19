import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrlBase: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const publicUrlBase = process.env.R2_PUBLIC_URL_BASE;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrlBase) {
      throw new Error('R2 configuration is missing. Please check your environment variables.');
    }

    this.bucket = bucket;
    this.publicUrlBase = publicUrlBase;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to R2 storage
   * @param file - The file buffer or stream
   * @param filename - The original filename
   * @param folder - Optional folder path (e.g., 'products')
   * @returns The public URL of the uploaded file
   */
  async uploadFile(
    file: Buffer | Uint8Array,
    filename: string,
    folder: string = 'products',
  ): Promise<string> {
    // Generate a unique filename to avoid collisions
    const fileExtension = filename.split('.').pop() || 'jpg';
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
    const key = `${folder}/${uniqueFilename}`;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: this.getContentType(fileExtension),
        },
      });

      await upload.done();

      // Return the public URL
      return `${this.publicUrlBase}/${key}`;
    } catch (error) {
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to R2 storage
   * @param files - Array of file objects with buffer and filename
   * @param folder - Optional folder path
   * @returns Array of public URLs
   */
  async uploadFiles(
    files: Array<{ buffer: Buffer; originalname: string }>,
    folder: string = 'products',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.originalname, folder),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
