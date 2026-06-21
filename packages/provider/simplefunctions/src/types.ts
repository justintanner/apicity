import type { z } from "zod";
import type { SimpleFunctionsQueryRequest } from "./zod";

export type {
  SimpleFunctionsModel,
  SimpleFunctionsMode,
  SimpleFunctionsNextActions,
  SimpleFunctionsOptions,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsSource,
} from "./zod";

export class SimpleFunctionsError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "SimpleFunctionsError";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface SimpleFunctionsMarketMatch {
  title?: string;
  ticker?: string;
  slug?: string;
  price?: number;
  volume?: number;
  pageUrl?: string;
  apiUrl?: string;
  inspectUrl?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsAction {
  method?: string;
  url?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsNextActionsBlock {
  inspect?: SimpleFunctionsAction[];
  related?: SimpleFunctionsAction[];
  [key: string]: unknown;
}

export interface SimpleFunctionsQueryMeta {
  sources?: string[];
  mode?: string;
  latencyMs?: number;
  ts?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsQueryResponse {
  query: string;
  contextSuggestion?: string;
  answer?: string;
  keyFactors?: string[];
  kalshi?: SimpleFunctionsMarketMatch[];
  polymarket?: SimpleFunctionsMarketMatch[];
  traditional?: Array<Record<string, unknown>>;
  x?: Array<Record<string, unknown>>;
  content?: Array<Record<string, unknown>>;
  theses?: Array<Record<string, unknown>>;
  legislation?: Array<Record<string, unknown>>;
  meta?: SimpleFunctionsQueryMeta;
  nextActions?: SimpleFunctionsNextActionsBlock;
  [key: string]: unknown;
}

export interface SimpleFunctionsQueryMethod {
  (
    req: SimpleFunctionsQueryRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsQueryResponse>;
  schema: z.ZodType<SimpleFunctionsQueryRequest>;
}

export interface SimpleFunctionsApiPublicNamespace {
  query: SimpleFunctionsQueryMethod;
}

export interface SimpleFunctionsApiNamespace {
  public: SimpleFunctionsApiPublicNamespace;
}

export interface SimpleFunctionsGetNamespace {
  api: SimpleFunctionsApiNamespace;
}

export interface SimpleFunctionsProvider {
  api: SimpleFunctionsApiNamespace;
  get: SimpleFunctionsGetNamespace;
}
