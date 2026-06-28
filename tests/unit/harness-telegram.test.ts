import { describe, expect, it } from "vitest";
import type { ChangedRecording, HarEntry } from "../har-data";
import {
  buildTelegramHarnessMessages,
  buildTelegramHarnessMessagesWithLivePoll,
  chunkMessage,
  collectMedia,
  formatTelegramEndpointMessageWithLivePoll,
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
    dotPath: "buckets.putAccelerateConfiguration",
    method: "PUT",
    fullUrl: "https://s3.us-east-1.amazonaws.com/{bucket}?accelerate",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAccelerateConfiguration.html",
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
  {
    provider: "xai",
    dotPath: "managementApi.v1.collections",
    method: "POST",
    fullUrl: "https://management-api.x.ai/v1/collections",
    docsUrl: "https://docs.x.ai/docs/api-reference",
  },
  {
    provider: "xai",
    dotPath: "v1.documents.search",
    method: "POST",
    fullUrl: "https://api.x.ai/v1/documents/search",
    docsUrl:
      "https://docs.x.ai/developers/rest-api-reference/collections/search",
  },
  {
    provider: "polymarket",
    dotPath: "clob.auth.apiKey",
    method: "POST",
    fullUrl: "https://clob.polymarket.com/auth/api-key",
    docsUrl: "https://docs.polymarket.com/api-reference/authentication",
  },
  {
    provider: "kie",
    dotPath: "api.v1.jobs.createTask",
    method: "POST",
    fullUrl: "https://api.kie.ai/api/v1/jobs/createTask",
    docsUrl: "https://docs.kie.ai/market/quickstart",
  },
  {
    provider: "alibaba",
    dotPath: "api.v1.services.aigc.videoGeneration.videoSynthesis",
    method: "POST",
    fullUrl:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
    docsUrl: "https://help.aliyun.com/zh/model-studio",
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

function s3PutAccelerateRecording(): ChangedRecording {
  const body =
    '<AccelerateConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
    "<Status>Suspended</Status>" +
    "</AccelerateConfiguration>";

  return {
    provider: "s3",
    recordingName: "s3/bucket-put-accelerate-configuration",
    changeType: "new",
    filePath:
      "tests/recordings/s3_106018211/" +
      "bucket-put-accelerate-configuration_123456789/recording.har",
    entries: [
      {
        request: {
          method: "PUT",
          url: "https://apicity-s3-fixtures.s3.us-east-1.amazonaws.com/?accelerate",
          headers: [{ name: "content-type", value: "application/xml" }],
          postData: {
            mimeType: "application/xml",
            text: body,
            params: [],
          },
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

function alibabaExpiredSignedVideoRecording(): ChangedRecording {
  return {
    provider: "alibaba",
    recordingName: "alibaba/wan-i2v",
    changeType: "new",
    filePath:
      "tests/recordings/alibaba_1329897167/" +
      "wan-i2v_2196817451/recording.har",
    entries: [
      {
        request: {
          method: "GET",
          url: "https://dashscope.aliyuncs.com/api/v1/tasks/task-id",
          headers: [],
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [{ name: "content-type", value: "application/json" }],
          content: {
            mimeType: "application/json",
            text: JSON.stringify({
              output: {
                task_status: "SUCCEEDED",
                video_url:
                  "https://dashscope-a717.oss-accelerate.aliyuncs.com/" +
                  "clip.mp4?Expires=1&OSSAccessKeyId=***&Signature=***",
              },
            }),
          },
        },
      },
    ],
  };
}

function xaiDocumentsSearchRecording(): ChangedRecording {
  return {
    provider: "xai",
    recordingName: "xai/documents-search",
    changeType: "new",
    filePath:
      "tests/recordings/xai_3613880225/" +
      "documents-search_2410887428/recording.har",
    entries: [
      {
        request: {
          method: "POST",
          url: "https://management-api.x.ai/v1/collections",
          headers: [{ name: "content-type", value: "application/json" }],
          postData: {
            mimeType: "application/json",
            text: JSON.stringify({
              collection_name: "test-collection-documents-search",
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
              collection_id: "collection_fixture",
            }),
          },
        },
      },
      {
        request: {
          method: "POST",
          url: "https://api.x.ai/v1/documents/search",
          headers: [{ name: "content-type", value: "application/json" }],
          postData: {
            mimeType: "application/json",
            text: JSON.stringify({
              query: "aurora-test-vector",
              source: { collection_ids: ["collection_fixture"] },
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
              matches: [{ file_id: "file_fixture" }],
            }),
          },
        },
      },
    ],
  };
}

function jsonHarEntry(
  method: string,
  url: string,
  requestBody: unknown,
  responseBody: unknown
): HarEntry {
  return {
    request: {
      method,
      url,
      headers: [{ name: "content-type", value: "application/json" }],
      postData:
        requestBody === null
          ? undefined
          : {
              mimeType: "application/json",
              text: JSON.stringify(requestBody),
            },
    },
    response: {
      status: 200,
      statusText: "OK",
      headers: [{ name: "content-type", value: "application/json" }],
      content: {
        mimeType: "application/json",
        text: JSON.stringify(responseBody),
      },
    },
  };
}

function kieImagePollRecording(): ChangedRecording {
  const taskId = "task-image";
  const inputUrl = "https://example.com/input.png";
  const param = JSON.stringify({
    input: JSON.stringify({
      image_urls: [inputUrl],
      prompt: "Turn the reference into a watercolor poster.",
    }),
    model: "grok-imagine/image-to-image",
  });

  return {
    provider: "kie",
    recordingName: "kie/grok-imagine-image-to-image",
    changeType: "new",
    filePath:
      "tests/recordings/kie_2079838932/" +
      "grok-imagine-image-to-image_123/recording.har",
    entries: [
      jsonHarEntry(
        "POST",
        "https://api.kie.ai/api/v1/jobs/createTask",
        {
          model: "grok-imagine/image-to-image",
          input: {
            prompt: "Turn the reference into a watercolor poster.",
            image_urls: [inputUrl],
          },
        },
        { code: 200, msg: "success", data: { taskId, recordId: taskId } }
      ),
      jsonHarEntry(
        "GET",
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        null,
        {
          code: 200,
          msg: "success",
          data: {
            taskId,
            model: "grok-imagine/image-to-image",
            state: "waiting",
            param,
            resultJson: "",
          },
        }
      ),
      jsonHarEntry(
        "GET",
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        null,
        {
          code: 200,
          msg: "success",
          data: {
            taskId,
            model: "grok-imagine/image-to-image",
            state: "success",
            param,
            resultJson: JSON.stringify({
              resultUrls: [
                "https://tempfile.aiquickdraw.com/generated/final-1.jpg",
                "https://tempfile.aiquickdraw.com/generated/final-2.jpg",
              ],
            }),
          },
        }
      ),
    ],
  };
}

function kieVideoPollRecording(): ChangedRecording {
  const taskId = "task-video";
  const inputUrl = "https://example.com/first-frame.jpg";
  const param = JSON.stringify({
    input: JSON.stringify({
      first_frame_url: inputUrl,
      prompt: "Animate a slow camera push.",
    }),
    model: "kling/v3-turbo-image-to-video",
  });

  return {
    provider: "kie",
    recordingName: "kie/kling-v3-turbo-image-to-video",
    changeType: "new",
    filePath:
      "tests/recordings/kie_2079838932/" +
      "kling-v3-turbo-image-to-video_123/recording.har",
    entries: [
      jsonHarEntry(
        "POST",
        "https://api.kie.ai/api/v1/jobs/createTask",
        {
          model: "kling/v3-turbo-image-to-video",
          input: {
            first_frame_url: inputUrl,
            prompt: "Animate a slow camera push.",
          },
        },
        { code: 200, msg: "success", data: { taskId, recordId: taskId } }
      ),
      jsonHarEntry(
        "GET",
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        null,
        {
          code: 200,
          msg: "success",
          data: {
            taskId,
            model: "kling/v3-turbo-image-to-video",
            state: "waiting",
            param,
            resultJson: "",
          },
        }
      ),
      jsonHarEntry(
        "GET",
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        null,
        {
          code: 200,
          msg: "success",
          data: {
            taskId,
            model: "kling/v3-turbo-image-to-video",
            state: "success",
            param,
            resultJson: JSON.stringify({
              resultUrls: ["https://tempfile.aiquickdraw.com/video/final.mp4"],
            }),
          },
        }
      ),
    ],
  };
}

// A z.ai-style generation whose recorded polls never reach terminal success:
// the job was still running when the HAR was captured. The last poll carries an
// intermediate frame that must NOT be sent as the final media.
function kiePendingGenerationRecording(): ChangedRecording {
  const taskId = "task-pending";
  const inputUrl = "https://example.com/input.png";
  const intermediateUrl =
    "https://tempfile.aiquickdraw.com/generated/intermediate.jpg";
  const param = JSON.stringify({
    input: JSON.stringify({
      image_urls: [inputUrl],
      prompt: "Render a slow-baking poster.",
    }),
    model: "grok-imagine/image-to-image",
  });

  return {
    provider: "kie",
    recordingName: "kie/grok-imagine-pending",
    changeType: "new",
    filePath:
      "tests/recordings/kie_2079838932/" +
      "grok-imagine-pending_123/recording.har",
    entries: [
      jsonHarEntry(
        "POST",
        "https://api.kie.ai/api/v1/jobs/createTask",
        {
          model: "grok-imagine/image-to-image",
          input: {
            prompt: "Render a slow-baking poster.",
            image_urls: [inputUrl],
          },
        },
        { code: 200, msg: "success", data: { taskId, recordId: taskId } }
      ),
      jsonHarEntry(
        "GET",
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        null,
        {
          code: 200,
          msg: "success",
          data: { taskId, state: "waiting", param, resultJson: "" },
        }
      ),
      jsonHarEntry(
        "GET",
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        null,
        {
          code: 200,
          msg: "success",
          data: {
            taskId,
            state: "generating",
            param,
            // An intermediate preview frame that must be suppressed.
            resultJson: JSON.stringify({ resultUrls: [intermediateUrl] }),
          },
        }
      ),
    ],
  };
}

// Build the kie success poll body the live poll endpoint would return.
function kieLiveSuccessBody(taskId: string, finalUrl: string): string {
  return JSON.stringify({
    code: 200,
    msg: "success",
    data: {
      taskId,
      state: "success",
      resultJson: JSON.stringify({ resultUrls: [finalUrl] }),
    },
  });
}

function alibabaFailedGenerationRecording(): ChangedRecording {
  const taskId = "task-failed";
  const inputUrl = "https://example.com/source.png";

  return {
    provider: "alibaba",
    recordingName: "alibaba/wan-i2v",
    changeType: "new",
    filePath:
      "tests/recordings/alibaba_1329897167/" + "wan-i2v_123/recording.har",
    entries: [
      jsonHarEntry(
        "POST",
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
        {
          model: "wan2.7-i2v",
          input: {
            prompt: "Animate the product image.",
            media: [{ type: "first_frame", url: inputUrl }],
          },
        },
        {
          request_id: "request-1",
          output: { task_id: taskId, task_status: "PENDING" },
        }
      ),
      jsonHarEntry(
        "GET",
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        null,
        {
          request_id: "request-2",
          output: {
            task_id: taskId,
            task_status: "FAILED",
            message: "Safety filter rejected the prompt",
          },
        }
      ),
    ],
  };
}

function mediaUrls(message: {
  media: Array<{
    source: { type: "url"; url: string } | { type: "base64"; data: string };
  }>;
}): string[] {
  return message.media.flatMap((item) =>
    item.source.type === "url" ? [item.source.url] : []
  );
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

  it("renders S3 XML request bodies in Telegram previews", () => {
    const [message] = buildTelegramHarnessMessages(
      [s3PutAccelerateRecording()],
      endpointDocs
    );

    expect(message.apicityPath).toBe("s3.buckets.putAccelerateConfiguration");
    expect(message.text).toContain("Request body");
    expect(message.text).toContain("AccelerateConfiguration");
    expect(message.text).toContain("Suspended");
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

  it("prefers a hinted endpoint over setup calls in multi-call recordings", () => {
    const [message] = buildTelegramHarnessMessages(
      [xaiDocumentsSearchRecording()],
      endpointDocs
    );

    expect(message.endpoint).toBe("POST https://api.x.ai/v1/documents/search");
    expect(message.apicityPath).toBe("xai.v1.documents.search");
    expect(message.text).toContain("aurora-test-vector");
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

  it("redacts Polymarket auth secrets from Telegram previews", () => {
    const recording: ChangedRecording = {
      provider: "polymarket",
      recordingName: "polymarket/clob-auth-api-key",
      changeType: "new",
      filePath:
        "tests/recordings/polymarket_3782428595/" +
        "clob-auth-api-key_123456789/recording.har",
      entries: [
        {
          request: {
            method: "POST",
            url: "https://clob.polymarket.com/auth/api-key",
            headers: [
              { name: "POLY_API_KEY", value: "poly-api-key" },
              { name: "POLY_PASSPHRASE", value: "poly-passphrase" },
              { name: "POLY_SIGNATURE", value: "poly-signature" },
              { name: "POLY_ADDRESS", value: "0xabc123" },
              { name: "POLY_TIMESTAMP", value: "1700000000" },
              { name: "POLY_NONCE", value: "7" },
              { name: "X-Relayer-API-Key", value: "relayer-key" },
              { name: "content-type", value: "application/json" },
            ],
            postData: {
              mimeType: "application/json",
              text: JSON.stringify({
                signature: "request-signature",
                builderApiKey: "builder-body-key",
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
                apiKey: "created-api-key",
                secret: "created-secret",
                passphrase: "created-passphrase",
              }),
            },
          },
        },
      ],
    };

    const [message] = buildTelegramHarnessMessages([recording], endpointDocs);
    const all = message.chunks.join("\n");

    expect(message.apicityPath).toBe("polymarket.clob.auth.apiKey");
    expect(all).toContain("POLY_ADDRESS: ***");
    expect(all).toContain('"apiKey": "***"');
    expect(all).toContain('"secret": "***"');
    expect(all).toContain('"passphrase": "***"');
    for (const leaked of [
      "poly-api-key",
      "poly-passphrase",
      "poly-signature",
      "0xabc123",
      "1700000000",
      "relayer-key",
      "request-signature",
      "builder-body-key",
      "created-api-key",
      "created-secret",
      "created-passphrase",
    ]) {
      expect(all).not.toContain(leaked);
    }
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

  it("uses the final KIE image generation poll response for review media", () => {
    const [message] = buildTelegramHarnessMessages(
      [kieImagePollRecording()],
      endpointDocs
    );

    expect(message.endpoint).toBe(
      "POST https://api.kie.ai/api/v1/jobs/createTask"
    );
    expect(message.text).toContain("Generation status");
    expect(message.text).toContain(
      "Generation completed with status success after 2 poll response(s)."
    );
    expect(message.text).toContain(
      "https://tempfile.aiquickdraw.com/generated/final-1.jpg"
    );
    expect(message.text).not.toContain('"state": "waiting"');
    expect(mediaUrls(message)).toEqual([
      "https://tempfile.aiquickdraw.com/generated/final-1.jpg",
      "https://tempfile.aiquickdraw.com/generated/final-2.jpg",
      "https://example.com/input.png",
    ]);
  });

  it("uses the final KIE video generation poll response for review media", () => {
    const [message] = buildTelegramHarnessMessages(
      [kieVideoPollRecording()],
      endpointDocs
    );

    expect(message.text).toContain(
      "Generation completed with status success after 2 poll response(s)."
    );
    expect(message.media[0]).toMatchObject({
      kind: "video",
      mime: "video/mp4",
      source: {
        type: "url",
        url: "https://tempfile.aiquickdraw.com/video/final.mp4",
      },
    });
    expect(mediaUrls(message)).toEqual([
      "https://tempfile.aiquickdraw.com/video/final.mp4",
      "https://example.com/first-frame.jpg",
    ]);
  });

  it("deduplicates repeated input media from async poll payloads", () => {
    const [message] = buildTelegramHarnessMessages(
      [kieImagePollRecording()],
      endpointDocs
    );

    expect(
      mediaUrls(message).filter(
        (url) => url === "https://example.com/input.png"
      )
    ).toHaveLength(1);
  });

  it("summarizes a terminal generation failure without poll media noise", () => {
    const [message] = buildTelegramHarnessMessages(
      [alibabaFailedGenerationRecording()],
      endpointDocs
    );

    expect(message.apicityPath).toBe(
      "alibaba.api.v1.services.aigc.videoGeneration.videoSynthesis"
    );
    expect(message.text).toContain(
      "Generation failed with status FAILED: Safety filter rejected the prompt."
    );
    expect(message.text).not.toContain('"task_status": "PENDING"');
    expect(mediaUrls(message)).toEqual(["https://example.com/source.png"]);
  });

  it("omits expired signed Alibaba OSS output URLs from media uploads", () => {
    const items = collectMedia(
      alibabaExpiredSignedVideoRecording(),
      "alibaba.api.v1.tasks.get"
    );

    expect(items).toEqual([]);
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

  it("suppresses intermediate frames when generation never reaches success", () => {
    const [message] = buildTelegramHarnessMessages(
      [kiePendingGenerationRecording()],
      endpointDocs
    );

    expect(message.text).toContain("Generation status");
    expect(message.text).toContain("Generation did not reach terminal success");
    // The intermediate preview frame must NOT be offered as uploadable media
    // (it may still appear verbatim inside the recorded response-body preview).
    expect(mediaUrls(message)).toEqual(["https://example.com/input.png"]);
    expect(mediaUrls(message)).not.toContain(
      "https://tempfile.aiquickdraw.com/generated/intermediate.jpg"
    );
  });
});

describe("harness Telegram live poll-and-wait", () => {
  const FINAL_URL = "https://tempfile.aiquickdraw.com/generated/live-final.jpg";

  it("waits for terminal success before choosing the media to send", async () => {
    const responses = ["waiting", "generating", "success"];
    let call = 0;
    const fetchImpl = (async (url: string | URL) => {
      const which = responses[Math.min(call, responses.length - 1)];
      call += 1;
      const body =
        which === "success"
          ? kieLiveSuccessBody("task-pending", FINAL_URL)
          : JSON.stringify({
              code: 200,
              msg: "success",
              data: { taskId: "task-pending", state: which },
            });
      expect(String(url)).toContain("recordInfo?taskId=task-pending");
      return new Response(body, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const message = await formatTelegramEndpointMessageWithLivePoll(
      kiePendingGenerationRecording(),
      endpointDocs,
      { fetchImpl, sleepImpl: async () => {}, maxAttempts: 5 }
    );

    expect(call).toBe(3);
    expect(message.text).toContain("Generation completed with status success");
    expect(mediaUrls(message)).toContain(FINAL_URL);
    expect(mediaUrls(message)).not.toContain(
      "https://tempfile.aiquickdraw.com/generated/intermediate.jpg"
    );
  });

  it("falls back to the status line when the live poll times out", async () => {
    let call = 0;
    const fetchImpl = (async () => {
      call += 1;
      return new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "task-pending", state: "generating" },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const [message] = await buildTelegramHarnessMessagesWithLivePoll(
      [kiePendingGenerationRecording()],
      endpointDocs,
      { fetchImpl, sleepImpl: async () => {}, maxAttempts: 3 }
    );

    expect(call).toBe(3);
    expect(message.text).toContain("Generation did not reach terminal success");
    expect(mediaUrls(message)).toEqual(["https://example.com/input.png"]);
  });

  it("gives up gracefully when every live poll errors", async () => {
    const fetchImpl = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const message = await formatTelegramEndpointMessageWithLivePoll(
      kiePendingGenerationRecording(),
      endpointDocs,
      { fetchImpl, sleepImpl: async () => {}, maxAttempts: 2 }
    );

    expect(message.text).toContain("Generation did not reach terminal success");
    expect(mediaUrls(message)).toEqual(["https://example.com/input.png"]);
  });
});
