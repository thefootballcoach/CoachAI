import { S3Client, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { PassThrough, Readable } from 'stream';

// Extract the actual AWS region from a potentially formatted string
// For example, convert "Europe (Stockholm) eu-north-1" to "eu-north-1"
function extractAwsRegion(regionString: string | undefined): string | undefined {
  if (!regionString) return undefined;
  
  // Try to extract a region code that matches AWS format
  const regionMatches = regionString.match(/([a-z]{2}-[a-z]+-\d+)/);
  if (regionMatches && regionMatches[1]) {
    console.log(`Extracted AWS region "${regionMatches[1]}" from "${regionString}"`);
    return regionMatches[1];
  }
  
  return regionString;
}

// Validate AWS Region format (should be something like 'us-east-1', 'eu-west-1', etc.)
function isValidAwsRegion(region: string | undefined): boolean {
  if (!region) return false;
  
  // AWS region format validation (simple regex for standard AWS regions)
  // Standard AWS regions follow the pattern: 'us-east-1', 'eu-west-2', etc.
  const validRegionPattern = /^[a-z]{2}-[a-z]+-\d+$/;
  return validRegionPattern.test(region);
}

// Extract and validate AWS region
const rawRegion = process.env.AWS_REGION;
const awsRegion = extractAwsRegion(rawRegion);

if (!isValidAwsRegion(awsRegion)) {
  console.error(`Invalid AWS region format: "${rawRegion}". AWS region should be in format like 'us-east-1'.`);
  console.error(`Please check your AWS_REGION environment variable.`);
}

// Initialize the S3 client with AWS credentials
const s3Client = new S3Client({
  region: awsRegion || 'us-east-1', // Fallback to us-east-1 if invalid
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

// Ensure all required environment variables are present
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || 
    !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
  console.error('Missing required AWS environment variables');
}

/**
 * Uploads a file to AWS S3 from a local file path
 * @param filePath Local path of the file to upload
 * @param key S3 object key (file path in S3)
 * @param onProgress Optional callback for upload progress
 * @returns S3 URL of the uploaded file
 */
export async function uploadFileToS3(
  filePath: string, 
  key: string, 
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Validate inputs
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found: ${filePath}`);
    }
    
    if (!key || typeof key !== 'string') {
      throw new Error(`Invalid S3 key: ${key}`);
    }
    
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
    }
    
    // Validate AWS configuration
    if (!isValidAwsRegion(awsRegion)) {
      throw new Error(`Invalid AWS region: "${awsRegion}". Must be in format like 'us-east-1'.`);
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not properly configured');
    }
    
    console.log(`Starting S3 upload for file: ${filePath} to key: ${key}`);
    console.log(`AWS Region: ${awsRegion}, Bucket: ${bucketName}`);
    
    // Create a read stream from the file
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;
    
    // Configure the upload
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ContentType: getContentType(filePath),
      },
    });

    // Track progress if a callback is provided
    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentComplete = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percentComplete);
          console.log(`S3 upload progress: ${percentComplete}% (${progress.loaded}/${progress.total} bytes)`);
        }
      });
    }

    // Execute the upload
    const result = await upload.done();
    
    console.log(`S3 upload complete for key: ${key}`);
    
    // Return the S3 URL
    return getS3Url(key);
  } catch (error: any) {
    console.error(`S3 upload error details:`, {
      filePath,
      key,
      bucketName,
      region: awsRegion,
      error: error.toString(),
      stack: error.stack
    });
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Uploads a file to AWS S3 directly from a buffer or stream
 * @param fileBuffer Buffer or stream containing the file data
 * @param filename Original filename for content type detection
 * @param key S3 object key (file path in S3)
 * @param onProgress Optional callback for upload progress
 * @returns S3 URL of the uploaded file
 */
export async function uploadBufferToS3(
  fileBuffer: Buffer | Readable,
  filename: string,
  key: string,
  fileSize?: number,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    console.log(`Starting S3 upload for buffer to key: ${key}`);
    
    // Configure the upload (bucket must have public read policy)
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: getContentType(filename),
        // ACL removed - bucket should have public read policy instead
      },
    });

    // Track progress if a callback is provided
    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && fileSize) {
          const percentComplete = Math.round((progress.loaded / fileSize) * 100);
          onProgress(percentComplete);
          console.log(`S3 upload progress: ${percentComplete}% (${progress.loaded}/${fileSize} bytes)`);
        } else if (progress.loaded && progress.total) {
          const percentComplete = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percentComplete);
          console.log(`S3 upload progress: ${percentComplete}%`);
        }
      });
    }

    // Execute the upload
    const result = await upload.done();
    
    console.log(`S3 upload complete for key: ${key}`);
    
    // Return the S3 URL
    return getS3Url(key);
  } catch (error: any) {
    console.error(`Error uploading buffer to S3:`, error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Checks if a file exists in S3
 * @param key S3 object key
 * @returns boolean indicating if the object exists
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Deletes a file from S3
 * @param key S3 object key
 * @returns boolean indicating if deletion was successful
 */
export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    console.log(`Successfully deleted file from S3: ${key}`);
    return true;
  } catch (error: any) {
    console.error(`Error deleting file from S3: ${key}`, error);
    return false;
  }
}

/**
 * Generates a signed URL for temporary access to an S3 object
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Signed URL for the S3 object
 */
export function getS3Url(key: string): string {
  // Use the extracted and validated region for URL generation
  return `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
}

/**
 * Determines content type based on file extension
 * @param filePath Path or filename to analyze
 * @returns MIME type for the file
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    // Audio formats
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.m4a':
      return 'audio/mp4';
    case '.aac':
      return 'audio/aac';
    // Video formats
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.avi':
      return 'video/x-msvideo';
    case '.webm':
      return 'video/webm';
    // Image formats
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    // Text formats
    case '.txt':
      return 'text/plain';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Generates a unique S3 key for an audio file
 * @param userId User ID
 * @param filename Original filename
 * @returns Unique S3 key
 */
export function generateVideoKey(userId: number, filename: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const cleanFilename = path.basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9]/g, '_');
  const ext = path.extname(filename);
  
  // Create a key format that's consistent with what getAudioFilePath expects
  return `audios/${userId}_${timestamp}_${randomSuffix}_${cleanFilename}${ext}`;
}

/**
 * Downloads a file from S3 to the local file system
 * @param key S3 object key
 * @param localPath Local path to save the file
 * @param onProgress Optional callback for download progress
 * @returns Local file path if successful, null otherwise
 */
export async function downloadFromS3(
  key: string,
  localPath: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    console.log(`Starting S3 download for key: ${key} to ${localPath}`);
    
    // Create the directory if it doesn't exist
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Get the object from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('S3 response body is empty');
    }
    
    // Create a write stream to save the file
    const writeStream = fs.createWriteStream(localPath);
    
    // Convert the readable stream to a node.js stream
    if (response.Body instanceof Readable) {
      // Pipe the response to the file
      response.Body.pipe(writeStream);
      
      // Wait for the stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log(`S3 download complete for key: ${key}`);
          resolve();
        });
        writeStream.on('error', (err) => {
          reject(err);
        });
      });
      
      return localPath;
    } else {
      throw new Error('S3 response body is not a readable stream');
    }
  } catch (error: any) {
    console.error(`Error downloading file from S3:`, error);
    return null;
  }
}