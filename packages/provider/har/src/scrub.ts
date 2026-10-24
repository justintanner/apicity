import {
  redactPersistedHarSecrets,
  type PersistedHarRecording,
} from "./persist.js";
import type { Har } from "./types.js";

/** Mutates an entry in place and returns it. Existing placeholder text is retained. */
export function scrubEntry<T extends PersistedHarRecording>(entry: T): T {
  redactPersistedHarSecrets(entry);
  const request = entry.request as PersistedHarRecording["request"] & {
    queryString?: Array<{ name: string; value: string }>;
  };
  if (request?.queryString && request.url) {
    const query = new URL(request.url).searchParams;
    request.queryString = Array.from(query, ([name, value]) => ({
      name,
      value,
    }));
  }
  return entry;
}

/** Mutates a HAR in place, including call input using the provider's body rules. */
export function scrubHar<T extends Har>(har: T): T {
  for (const entry of har.log.entries) scrubEntry(entry);
  const meta = har.log._apicity;
  if (meta) {
    const providerUrls: Record<string, string> = {
      telegram: "https://api.telegram.org/bot***/call",
      polymarket: "https://clob.polymarket.com/",
    };
    const url =
      providerUrls[meta.provider] ??
      har.log.entries[0]?.request.url ??
      "https://local.invalid/";
    const text = JSON.stringify(meta.input);
    if (text !== undefined) {
      const entry: PersistedHarRecording = {
        request: { url, postData: { text } },
      };
      scrubEntry(entry);
      entry.response = { content: { text: entry.request!.postData!.text! } };
      scrubEntry(entry);
      meta.input = JSON.parse(entry.response.content!.text!);
    }
  }
  return har;
}
