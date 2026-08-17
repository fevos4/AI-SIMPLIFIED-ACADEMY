import { S3Client, GetObjectCommand, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const provider = process.env.STORAGE_PROVIDER || 'minio';
const bucketName = process.env.STORAGE_BUCKET || 'elearning';

function createS3Client(): S3Client {
  if (provider === 'b2') {
    return new S3Client({
      endpoint: `https://${process.env.B2_ENDPOINT}`,
      region: 'us-west-004',
      credentials: {
        accessKeyId: process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APPLICATION_KEY || '',
      },
      forcePathStyle: true,
    });
  }

  // Default to MinIO
  const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : '';
  const useSsl = process.env.MINIO_USE_SSL === 'true';
  const protocol = useSsl ? 'https' : 'http';
  const endpoint = `${protocol}://${process.env.MINIO_ENDPOINT || 'localhost'}${port}`;

  return new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadminpassword',
    },
    forcePathStyle: true,
  });
}

export const s3Client = createS3Client();

export async function generatePresignedPutUrl(key: string, contentType?: string, expiresInSeconds: number = 3600): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function generatePresignedGetUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function deleteStorageFile(key: string): Promise<boolean> {
  if (!key) return true;
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    console.log(`[Storage] Deleted file '${key}' from bucket '${bucketName}'.`);
    return true;
  } catch (err) {
    console.error(`[Storage Error] Failed to delete file '${key}':`, err);
    return false;
  }
}

export async function ensureBucketExists(): Promise<void> {
  if (provider !== 'minio') {
    return; // Skip bucket creation check for production B2
  }

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket '${bucketName}' created successfully.`);
      } catch (createErr) {
        console.error(`Failed to create bucket '${bucketName}':`, createErr);
      }
    } else {
      console.error(`Bucket health check failed for '${bucketName}':`, err);
    }
  }
}
