import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@invoicely/utilities";
import { middleware } from "@/trpc/init";

export const awsS3Middleware = middleware(async function awsS3Middleware(options) {
  const s3 = new S3Client({
    forcePathStyle: true,
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return options.next({
    ctx: {
      s3: s3,
      // getPresignedUrl: getSignedUrl,   <---- Dont ever use this shit again
    },
  });
});
