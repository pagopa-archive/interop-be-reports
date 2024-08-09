import {
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import * as crypto from 'crypto'

export class AwsS3BucketClient {
  private s3Client: S3Client

  constructor(private bucket: string, region: string) {
    this.s3Client = new S3Client({ region })
  }

  /**
   * Uploads a JSON file to an S3 bucket.
   * @param data The data to be uploaded. The data will be stringified if it is not a string.
   * @param path The path in which the data will be stored in the bucket.
   */
  public async uploadData(data: string | unknown, path: string): Promise<void> {
    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data)
    const fileData = Buffer.from(stringifiedData)

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: stringifiedData,
        ContentMD5: this.getMD5HashFromFile(fileData),
      })
    )
  }

  /**
   * Uploads a JSON file to an S3 bucket.
   * @param data The data to be uploaded.
   * @param path The path in which the data will be stored in the bucket.
   */
  public async uploadBinaryData(data: Buffer, path: string): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: data,
        ContentMD5: this.getMD5HashFromFile(data),
      })
    )
  }

  /**
   * Gets the data stored in the specified path.
   * If the path does not exist, `undefined` is returned.
   * @param path The path of the data to be retrieved.
   * @returns The data stored in the specified path as a string.
   */
  public async getData(path: string): Promise<string | undefined> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: path,
        })
      )

      const statusCode = response.$metadata.httpStatusCode

      // NoSuchKey is thrown when the key does not exist.
      // AWS S3 does not distinguish between “NoSuchKey” and “AccessDenied”.
      // This is a security measure to prevent attackers from discovering information about the existence of keys.
      if (statusCode === 403) throw new NoSuchKey({ $metadata: response.$metadata, message: 'Access Denied' })

      return await response.Body?.transformToString()
    } catch (e) {
      if (e instanceof NoSuchKey) return undefined
      else throw e
    }
  }

  /**
   * Get the list of objects .
   * @returns The list of objects .
   * */
  async getBucketContentList(): Promise<Array<string>> {
    let response: ListObjectsV2CommandOutput | undefined = undefined
    const contentKeys: Array<string> = []

    do {
      const ContinuationToken: string | undefined = response ? response.NextContinuationToken : undefined
      response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken,
        })
      )
      const keys = (response.Contents?.map((c) => c.Key).filter(Boolean) ?? []) as string[]
      contentKeys.push(...keys)
    } while (response && response.IsTruncated)

    return contentKeys
  }

  /**
   * Get MD5 hash from file
   * @param file - File to get MD5 hash from
   * @returns MD5 hash
   */
  private getMD5HashFromFile(file: Buffer): string {
    return crypto.createHash('md5').update(file).digest('base64')
  }
}
