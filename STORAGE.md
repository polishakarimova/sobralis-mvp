# Event Image Storage

Uploaded event images are stored outside PostgreSQL in S3-compatible object storage.

PostgreSQL stores only metadata on `Event`:

- `coverImageUrl`
- `coverImageKey`
- `coverImageSource`
- `coverImagePositionX`
- `coverImagePositionY`

## Required env variables

Add these values to `.env` locally and to the server `.env`:

```env
S3_ENDPOINT="https://..."
S3_REGION="ru-1"
S3_BUCKET="sobralis"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PUBLIC_BASE_URL="https://.../sobralis"
```

## Timeweb setup

1. Create or open Timeweb Object Storage.
2. Create a bucket for Sobralis event images.
3. Create access keys for this bucket.
4. Copy endpoint, region, bucket name, access key, and secret key into env variables.
5. Set `S3_PUBLIC_BASE_URL` to the public URL where uploaded objects can be read.

Without these variables, preset images still work, but custom uploads return a storage configuration error.
