import { describe, expect, it } from "vitest";
import type { ChangedRecording } from "../har-data";
import {
  buildTelegramHarnessMessages,
  chunkMessage,
  collectMedia,
  type EndpointDocRow,
} from "../harness-telegram";

const endpointDocs: EndpointDocRow[] = [
  {
    provider: "fal",
    dotPath: "bytedance.seedSpeech.tts.v2",
    method: "POST",
    fullUrl: "https://api.fal.ai/v1/fal-ai/bytedance/seed-speech/tts/v2",
    docsUrl: "https://fal.ai/models/fal-ai/bytedance/seed-speech/tts/v2/api",
  },
  {
    provider: "binance",
    dotPath: "api.v3.exchangeInfo",
    method: "GET",
    fullUrl: "https://api.binance.com/api/v3/exchangeInfo{query}",
    docsUrl:
      "https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchange-information",
  },
  {
    provider: "s3",
    dotPath: "buckets.head",
    method: "HEAD",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadBucket.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getCors",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?cors",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketCors.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getLifecycle",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLifecycleConfiguration.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getLifecycleLegacy",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLifecycle.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getNotification",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?notification",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketNotificationConfiguration.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getNotificationLegacy",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?notification",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketNotification.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getMetadataTableConfiguration",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?metadataTable",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetadataTableConfiguration.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.listIntelligentTiering",
    method: "GET",
    fullUrl:
      "https://s3.us-east-1.amazonaws.com/{bucket}?intelligent-tiering{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketIntelligentTieringConfigurations.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.listMetrics",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketMetricsConfigurations.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.getMetrics",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetricsConfiguration.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.listDirectory",
    method: "GET",
    fullUrl: "https://s3express-control.{param}.amazonaws.com/{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListDirectoryBuckets.html",
  },
  {
    provider: "s3",
    dotPath: "buckets.updateMetadataInventoryTable",
    method: "PUT",
    fullUrl:
      "https://s3.us-east-1.amazonaws.com/{bucket}?metadataInventoryTable",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateBucketMetadataInventoryTableConfiguration.html",
  },
  {
    provider: "s3",
    dotPath: "objects.listLegacy",
    method: "GET",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html",
  },
  {
    provider: "s3",
    dotPath: "objects.put",
    method: "PUT",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}/{key}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html",
  },
  {
    provider: "s3",
    dotPath: "objects.copy",
    method: "PUT",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}/{key}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html",
  },
  {
    provider: "s3",
    dotPath: "objects.rename",
    method: "PUT",
    fullUrl:
      "https://s3express-{param}.{param}.amazonaws.com/{bucket}/{key}?renameObject",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_RenameObject.html",
  },
  {
    provider: "s3",
    dotPath: "objects.getAttributes",
    method: "GET",
    fullUrl:
      "https://s3.us-east-1.amazonaws.com/{bucket}/{key}?attributes{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAttributes.html",
  },
  {
    provider: "s3",
    dotPath: "objects.updateEncryption",
    method: "PUT",
    fullUrl:
      "https://s3.us-east-1.amazonaws.com/{bucket}/{key}?encryption{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateObjectEncryption.html",
  },
  {
    provider: "s3",
    dotPath: "objectLambda.writeGetObjectResponse",
    method: "POST",
    fullUrl:
      "https://{param}.s3-object-lambda.{param}.amazonaws.com/WriteGetObjectResponse",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_WriteGetObjectResponse.html",
  },
  {
    provider: "b2",
    dotPath: "objects.listLegacy",
    method: "GET",
    fullUrl: "https://s3.us-west-004.backblazeb2.com/{bucket}{query}",
    docsUrl:
      "https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api",
  },
  {
    provider: "b2",
    dotPath: "objects.list",
    method: "GET",
    fullUrl:
      "https://s3.us-west-004.backblazeb2.com/{bucket}?list-type=2{query}",
    docsUrl:
      "https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api",
  },
];

function seedSpeechRecording(): ChangedRecording {
  return {
    provider: "fal",
    recordingName: "fal/bytedance-seed-speech-tts-v2",
    changeType: "new",
    filePath:
      "tests/recordings/fal_2801268556/" +
      "bytedance-seed-speech-tts-v2_817081260/recording.har",
    entries: [
      {
        request: {
          method: "POST",
          url: "https://fal.run/fal-ai/bytedance/seed-speech/tts/v2",
          headers: [{ name: "content-type", value: "application/json" }],
          postData: {
            mimeType: "application/json",
            text: JSON.stringify({
              text: "Hello from Apicity.",
              voice: "stokie_en",
              output_format: "mp3",
            }),
          },
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/json" }],
          content: {
            mimeType: "application/json",
            text: JSON.stringify({
              audio: {
                url: "https://v3b.fal.media/files/b/audio.mp3",
                content_type: "audio/mpeg",
              },
            }),
          },
        },
      },
    ],
  };
}

function binanceExchangeInfoRecording(): ChangedRecording {
  return {
    provider: "binance",
    recordingName: "binance/exchange-info",
    changeType: "new",
    filePath:
      "tests/recordings/binance_1298037041/" +
      "exchange-info_3388488339/recording.har",
    entries: [
      {
        request: {
          method: "GET",
          url: "https://api.binance.com/api/v3/exchangeInfo?symbol=BTCUSDT",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/json" }],
          content: {
            mimeType: "application/json",
            text: JSON.stringify({
              timezone: "UTC",
              symbols: [{ symbol: "BTCUSDT", status: "TRADING" }],
            }),
          },
        },
      },
    ],
  };
}

function s3HeadBucketRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/bucket-read",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" + "bucket-read_992866278/recording.har",
    entries: [
      {
        request: {
          method: "HEAD",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [
            { name: "x-amz-bucket-region", value: "us-east-1" },
            { name: "x-amz-access-point-alias", value: "false" },
            { name: "x-amz-request-id", value: "redacted-noise" },
          ],
          content: {},
        },
      },
    ],
  };
}

function s3PutObjectRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/object-management",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "object-management_1494981478/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/apicity-tests/object-management-source.txt",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "etag", value: '"etag"' }],
          content: {},
        },
      },
    ],
  };
}

function s3BucketCorsRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/bucket-config",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "bucket-config_123456789/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/?cors",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [],
          content: {},
        },
      },
      {
        request: {
          method: "GET",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/?cors",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<CORSConfiguration></CORSConfiguration>",
          },
        },
      },
    ],
  };
}

function s3BucketMetricsRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/bucket-config",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "bucket-config_123456789/recording.har",
    entries: [
      {
        request: {
          method: "GET",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/?metrics&id=metrics-1",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<MetricsConfiguration></MetricsConfiguration>",
          },
        },
      },
    ],
  };
}

function s3CopyObjectRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/object-management",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "object-management_1494981478/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/apicity-tests/object-management-copy.txt",
          headers: [
            {
              name: "x-amz-copy-source",
              value:
                "/apicity-s3-fixtures/apicity-tests/object-management-source.txt",
            },
          ],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<CopyObjectResult></CopyObjectResult>",
          },
        },
      },
    ],
  };
}

function s3ObjectAttributesRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/object-governance",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "object-governance_123456789/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/apicity-tests/object-governance.csv",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "etag", value: '"etag"' }],
          content: {},
        },
      },
      {
        request: {
          method: "GET",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/apicity-tests/object-governance.csv?attributes",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<GetObjectAttributesResponse></GetObjectAttributesResponse>",
          },
        },
      },
    ],
  };
}

function s3DirectoryBucketsRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/directory-buckets",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "directory-buckets_123456789/recording.har",
    entries: [
      {
        request: {
          method: "GET",
          url: "https://s3express-control.us-east-1.amazonaws.com/?max-directory-buckets=1",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<ListAllMyDirectoryBucketsResult></ListAllMyDirectoryBucketsResult>",
          },
        },
      },
    ],
  };
}

function s3MetadataInventoryRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/metadata-inventory",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "metadata-inventory_123456789/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/?metadataInventoryTable",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "x-amz-request-charged", value: "requester" }],
          content: {},
        },
      },
    ],
  };
}

function s3BucketSubresourceRecording(
  recordingName: string,
  method: string,
  query: string
): ChangedRecording {
  return {
    provider: "s3",
    recordingName,
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      `${recordingName.split("/")[1]}_123456789/recording.har`,
    entries: [
      {
        request: {
          method,
          url: `https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/?${query}`,
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<Result></Result>",
          },
        },
      },
    ],
  };
}

function s3RenameObjectRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/rename-object",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "rename-object_123456789/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://demo--use1-az1--x-s3.s3express-use1-az1.us-east-1.amazonaws.com/dest.txt?renameObject",
          headers: [{ name: "x-amz-rename-source", value: "/source.txt" }],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [],
          content: {},
        },
      },
    ],
  };
}

function s3UpdateObjectEncryptionRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/update-object-encryption",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "update-object-encryption_123456789/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/apicity-tests/secure.txt?encryption&versionId=v1",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "x-amz-request-charged", value: "requester" }],
          content: {},
        },
      },
    ],
  };
}

function s3ObjectLambdaRecording(): ChangedRecording {
  return {
    provider: "s3",
    recordingName: "s3/object-lambda",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "object-lambda_123456789/recording.har",
    entries: [
      {
        request: {
          method: "POST",
          url: "https://route-1.s3-object-lambda.us-east-1.amazonaws.com/WriteGetObjectResponse",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [],
          content: {},
        },
      },
    ],
  };
}

function b2ListObjectsV2Recording(): ChangedRecording {
  return {
    provider: "b2",
    recordingName: "b2/object-core",
    changeType: "new",
    filePath:
      "tests/recordings/b2_2402036085/" +
      "object-core_2379895886/recording.har",
    entries: [
      {
        request: {
          method: "GET",
          url: "https://s3.us-west-004.backblazeb2.com/apicity?list-type=2&max-keys=10&prefix=apicity-tests%2F",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/xml" }],
          content: {
            mimeType: "application/xml",
            text: "<ListBucketResult></ListBucketResult>",
          },
        },
      },
    ],
  };
}

describe("harness Telegram messages", () => {
  it("renders endpoint recordings as Telegram HTML instead of raw Markdown", () => {
    const [message] = buildTelegramHarnessMessages(
      [seedSpeechRecording()],
      endpointDocs
    );

    expect(message.parse_mode).toBe("HTML");
    expect(message.endpoint).toBe(
      "POST https://fal.run/fal-ai/bytedance/seed-speech/tts/v2"
    );
    expect(message.apicityPath).toBe("fal.run.bytedance.seedSpeech.tts.v2");
    expect(message.text).toContain(
      "✅ <b>fal/bytedance-seed-speech-tts-v2</b>"
    );
    expect(message.text).toContain(
      "<code>fal.run.bytedance.seedSpeech.tts.v2</code>"
    );
    expect(message.text).toContain("<blockquote expandable>");
    expect(message.text).toContain("Request body");
    expect(message.text).toContain("Response body");
    // Full body content, untruncated, inside the expandable sections.
    expect(message.text).toContain("Hello from Apicity.");
    expect(message.text).toContain("v3b.fal.media/files/b/audio.mp3");
    expect(message.text).not.toContain("(truncated)");
    expect(message.text).not.toContain("```");
    expect(message.text).not.toContain("###");
    expect(message.chunks).toEqual([message.text]);
    // The recorded media URL becomes an inline upload, not a link.
    expect(message.media).toEqual([
      {
        kind: "audio",
        mime: "audio/mpeg",
        filename: "audio.mp3",
        caption:
          "fal/bytedance-seed-speech-tts-v2 — fal.run.bytedance.seedSpeech.tts.v2",
        source: { type: "url", url: "https://v3b.fal.media/files/b/audio.mp3" },
      },
    ]);
  });

  it("matches endpoint docs rows that use the {query} URL marker", () => {
    const [message] = buildTelegramHarnessMessages(
      [binanceExchangeInfoRecording()],
      endpointDocs
    );

    expect(message.endpoint).toBe(
      "GET https://api.binance.com/api/v3/exchangeInfo"
    );
    expect(message.apicityPath).toBe("binance.api.v3.exchangeInfo");
    expect(message.text).toContain(
      "developers.binance.com/docs/binance-spot-api-docs"
    );
  });

  it("renders response headers when the endpoint has no response body", () => {
    const [message] = buildTelegramHarnessMessages(
      [s3HeadBucketRecording()],
      endpointDocs
    );

    expect(message.apicityPath).toBe("s3.buckets.head");
    expect(message.text).toContain("Response headers");
    expect(message.text).toContain("x-amz-bucket-region");
    expect(message.text).toContain("us-east-1");
    expect(message.text).not.toContain("redacted-noise");
  });

  it("matches S3 virtual-hosted object requests", () => {
    const [putMessage] = buildTelegramHarnessMessages(
      [s3PutObjectRecording()],
      endpointDocs
    );
    const [copyMessage] = buildTelegramHarnessMessages(
      [s3CopyObjectRecording()],
      endpointDocs
    );

    expect(putMessage.apicityPath).toBe("s3.objects.put");
    expect(copyMessage.apicityPath).toBe("s3.objects.copy");
  });

  it("matches S3 bucket configuration requests", () => {
    const [corsMessage] = buildTelegramHarnessMessages(
      [s3BucketCorsRecording()],
      endpointDocs
    );
    const [metricsMessage] = buildTelegramHarnessMessages(
      [s3BucketMetricsRecording()],
      endpointDocs
    );

    expect(corsMessage.apicityPath).toBe("s3.buckets.getCors");
    expect(metricsMessage.apicityPath).toBe("s3.buckets.getMetrics");
  });

  it("prefers S3 response bodies and matches object subresources", () => {
    const [message] = buildTelegramHarnessMessages(
      [s3ObjectAttributesRecording()],
      endpointDocs
    );

    expect(message.apicityPath).toBe("s3.objects.getAttributes");
    expect(message.text).toContain("Response body");
    expect(message.text).toContain("GetObjectAttributesResponse");
  });

  it("matches specialized S3 endpoint recordings", () => {
    const messages = buildTelegramHarnessMessages(
      [
        s3DirectoryBucketsRecording(),
        s3MetadataInventoryRecording(),
        s3RenameObjectRecording(),
        s3UpdateObjectEncryptionRecording(),
        s3ObjectLambdaRecording(),
      ],
      endpointDocs
    );

    expect(messages.map((message) => message.apicityPath)).toEqual([
      "s3.buckets.listDirectory",
      "s3.buckets.updateMetadataInventoryTable",
      "s3.objects.rename",
      "s3.objects.updateEncryption",
      "s3.objectLambda.writeGetObjectResponse",
    ]);
  });

  it("matches S3 compatibility subresources and legacy aliases", () => {
    const messages = buildTelegramHarnessMessages(
      [
        s3BucketSubresourceRecording(
          "s3/bucket-get-metadata-table-configuration",
          "GET",
          "metadataTable"
        ),
        s3BucketSubresourceRecording(
          "s3/bucket-list-intelligent-tiering",
          "GET",
          "intelligent-tiering"
        ),
        s3BucketSubresourceRecording(
          "s3/bucket-get-lifecycle-legacy",
          "GET",
          "lifecycle"
        ),
        s3BucketSubresourceRecording(
          "s3/bucket-get-notification-legacy",
          "GET",
          "notification"
        ),
        s3BucketSubresourceRecording("s3/list-objects", "GET", "max-keys=1"),
      ],
      endpointDocs
    );

    expect(messages.map((message) => message.apicityPath)).toEqual([
      "s3.buckets.getMetadataTableConfiguration",
      "s3.buckets.listIntelligentTiering",
      "s3.buckets.getLifecycleLegacy",
      "s3.buckets.getNotificationLegacy",
      "s3.objects.listLegacy",
    ]);
  });

  it("matches B2 S3-compatible endpoint rows", () => {
    const [message] = buildTelegramHarnessMessages(
      [b2ListObjectsV2Recording()],
      endpointDocs
    );

    expect(message.apicityPath).toBe("b2.objects.list");
    expect(message.text).toContain("backblaze.com/docs");
  });

  it("redacts credential-shaped headers and drops cookies", () => {
    const recording = seedSpeechRecording();
    recording.entries[0].request.headers = [
      { name: "authorization", value: "Bearer real-key-leak" },
      { name: "x-custom-token", value: "real-token-leak" },
      { name: "cookie", value: "session=real-cookie-leak" },
      { name: "accept", value: "application/json" },
    ];
    recording.entries[0].response.headers = [
      { name: "set-cookie", value: "PHPSESSID=real-session-leak" },
      { name: "anthropic-organization-id", value: "org-real-leak" },
      { name: "openai-project", value: "proj-real-leak" },
      { name: "request-id", value: "req-real-leak" },
      { name: "x-request-id", value: "req-x-real-leak" },
      { name: "content-type", value: "application/json" },
    ];

    const [message] = buildTelegramHarnessMessages([recording], endpointDocs);
    const all = message.chunks.join("\n");

    expect(all).toContain("accept: application/json");
    expect(all).toContain("authorization: ***");
    expect(all).toContain("x-custom-token: ***");
    expect(all).not.toContain("real-key-leak");
    expect(all).not.toContain("real-token-leak");
    expect(all).not.toContain("real-cookie-leak");
    expect(all).not.toContain("real-session-leak");
    expect(all).not.toContain("org-real-leak");
    expect(all).not.toContain("proj-real-leak");
    expect(all).not.toContain("req-real-leak");
    expect(all).not.toContain("req-x-real-leak");
  });

  it("splits oversized content into chunks under Telegram's limit", () => {
    const bigJson = JSON.stringify(
      { rows: Array.from({ length: 400 }, (_, i) => `value & <tag> ${i}`) },
      null,
      2
    );
    const chunks = chunkMessage(
      "✅ <b>fal/huge-response</b>",
      "fal/huge-response",
      [
        { title: "Request body (1 KB)", body: '{"prompt":"hi"}' },
        { title: "Response body (20 KB)", body: bigJson },
      ]
    );

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(4096);
      // Blockquotes always open and close within a single chunk.
      expect(chunk.split("<blockquote expandable>").length).toBe(
        chunk.split("</blockquote>").length
      );
      // No raw angle brackets from the body escaped content.
      expect(chunk).not.toContain("<tag>");
    }
    expect(chunks[0]).toContain("✅ <b>fal/huge-response</b>");
    expect(chunks[1]).toContain("<b>fal/huge-response</b> <i>(part 2/");
    expect(chunks.join("")).toContain("— part 1/");
  });

  it("collects base64 response bodies as inline media uploads", () => {
    const recording = seedSpeechRecording();
    recording.entries[0].response.content = {
      mimeType: "audio/mpeg",
      encoding: "base64",
      text: Buffer.from("fake-mp3-bytes").toString("base64"),
    };

    const items = collectMedia(
      recording,
      "fal.run.bytedance.seedSpeech.tts.v2"
    );

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("audio");
    expect(items[0].mime).toBe("audio/mpeg");
    expect(items[0].filename).toBe("bytedance-seed-speech-tts-v2-1.mp3");
    expect(items[0].source).toEqual({
      type: "base64",
      data: Buffer.from("fake-mp3-bytes").toString("base64"),
    });
    expect(items[0].caption.length).toBeLessThanOrEqual(1024);
  });

  it("marks binary response bodies as sent below instead of dumping bytes", () => {
    const recording = seedSpeechRecording();
    recording.entries[0].response.content = {
      mimeType: "audio/mpeg",
      encoding: "base64",
      text: Buffer.from("fake-mp3-bytes").toString("base64"),
    };

    const [message] = buildTelegramHarnessMessages([recording], endpointDocs);

    expect(message.text).toContain("binary audio/mpeg");
    expect(message.text).toContain("sent below as media");
    expect(message.text).not.toContain(
      Buffer.from("fake-mp3-bytes").toString("base64")
    );
  });
});
