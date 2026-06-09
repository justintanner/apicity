import { describe, expect, it } from "vitest";
import type { ChangedRecording } from "../har-data";
import {
  buildTelegramHarnessMessages,
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
    dotPath: "objects.getAttributes",
    method: "GET",
    fullUrl:
      "https://s3.us-east-1.amazonaws.com/{bucket}/{key}?attributes{query}",
    docsUrl:
      "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAttributes.html",
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
    expect(message.text).toContain("<b>Apicity endpoint</b>");
    expect(message.text).toContain(
      "<code>fal.run.bytedance.seedSpeech.tts.v2</code>"
    );
    expect(message.text).toContain("<pre>{");
    expect(message.text).toContain(
      '<a href="https://v3b.fal.media/files/b/audio.mp3">audio</a>'
    );
    expect(message.text).not.toContain("```");
    expect(message.text).not.toContain("###");
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
    expect(message.text).toContain("<b>Response</b>");
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
    expect(message.text).toContain("<b>Response</b>");
    expect(message.text).toContain("GetObjectAttributesResponse");
  });
});
