const { S3Client } = require('@aws-sdk/client-s3');

// Cloudflare R2 is S3-compatible, so we use the AWS SDK pointed at R2's endpoint.
// Required env vars:
//   R2_ACCOUNT_ID       - your Cloudflare account ID
//   R2_ACCESS_KEY_ID    - R2 API token access key
//   R2_SECRET_ACCESS_KEY - R2 API token secret key
//   R2_BUCKET_NAME      - the bucket you created for this app
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

module.exports = { r2Client, BUCKET_NAME };