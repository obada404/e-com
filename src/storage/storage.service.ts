import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as crypto from 'crypto';
import axios from 'axios';

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
   * Download an image from a URL and upload it to R2 storage
   * @param imageUrl - The URL of the image to download
   * @param folder - Optional folder path (e.g., 'products')
   * @returns The public URL of the uploaded file in R2
   */
  async uploadImageFromUrl(
    imageUrl: string,
    folder: string = 'products',
  ): Promise<string> {
    try {
      // Download the image from the URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max file size
        validateStatus: (status) => status === 200,
      });

      // Get the content type from the response headers
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      // Extract filename from URL or generate one
      let filename = 'image';
      try {
        const urlPath = new URL(imageUrl).pathname;
        const urlFilename = urlPath.split('/').pop() || 'image';
        // Remove query parameters if any
        filename = urlFilename.split('?')[0];
        // If no extension, try to infer from content type
        if (!filename.includes('.')) {
          const extension = this.getExtensionFromContentType(contentType);
          filename = `${filename}.${extension}`;
        }
      } catch (error) {
        // If URL parsing fails, use content type to determine extension
        const extension = this.getExtensionFromContentType(contentType);
        filename = `image.${extension}`;
      }

      // Convert arraybuffer to Buffer
      const imageBuffer = Buffer.from(response.data);

      // Upload to R2
      return await this.uploadFile(imageBuffer, filename, folder);
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Failed to download image from URL: HTTP ${error.response.status} ${error.response.statusText || ''}`,
        );
      } else if (error.request) {
        throw new Error(
          `Failed to download image from URL: No response received. ${error.message}`,
        );
      } else {
        throw new Error(
          `Failed to download image from URL: ${error.message}`,
        );
      }
    }
  }

  /**
   * Upload multiple images from URLs to R2 storage
   * @param imageUrls - Array of image URLs to download and upload
   * @param folder - Optional folder path
   * @returns Array of public URLs in R2
   */
  async uploadImagesFromUrls(
    imageUrls: string[],
    folder: string = 'products',
  ): Promise<string[]> {
    const uploadPromises = imageUrls.map((url) =>
      this.uploadImageFromUrl(url, folder),
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

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType: string): string {
    const contentTypes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    return contentTypes[contentType.toLowerCase()] || 'jpg';
  }
}
