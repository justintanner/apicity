import {
  ElevenLabsCreateOrderRequest,
  ElevenLabsCreateOrderResponse,
  ElevenLabsListOrdersRequest,
  ElevenLabsListOrdersResponse,
  ElevenLabsOrderDeliverablesResponse,
  ElevenLabsOrderItemKind,
  ElevenLabsOrderLanguagesResponse,
  ElevenLabsOrderMediaResponse,
  ElevenLabsOrderResponse,
  ElevenLabsRegisterOrderMediaRequest,
  ElevenLabsRegisterOrderMediaResponse,
  ElevenLabsRemoveOrderItemResponse,
  ElevenLabsSubmitOrderResponse,
  ElevenLabsUpdateOrderRequest,
  ElevenLabsUpdateOrderResponse,
  ElevenLabsUpsertOrderItemRequest,
  ElevenLabsUpsertOrderItemResponse,
} from "./types";
import {
  ElevenLabsCreateOrderRequestSchema,
  ElevenLabsListOrdersRequestSchema,
  ElevenLabsRegisterOrderMediaRequestSchema,
  ElevenLabsUpdateOrderRequestSchema,
  ElevenLabsUpsertOrderItemRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createProductionsEndpoints(ctx: ElevenLabsContext) {
  const {
    makeJsonRequest,
    makeMultipartJsonRequest,
    appendFormField,
    buildQueryString,
  } = ctx;

  // GET https://api.elevenlabs.io/v1/productions/orders
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/list
  const listOrders = Object.assign(
    async (
      req: ElevenLabsListOrdersRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListOrdersResponse> => {
      return makeJsonRequest<ElevenLabsListOrdersResponse>(
        "GET",
        "/v1/productions/orders",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListOrdersRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/create
  const createOrder = Object.assign(
    async (
      req: ElevenLabsCreateOrderRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateOrderResponse> => {
      return makeJsonRequest<ElevenLabsCreateOrderResponse>(
        "POST",
        "/v1/productions/orders",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateOrderRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/{orderId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/get
  const getOrder = Object.assign(
    async (
      orderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderResponse> => {
      return makeJsonRequest<ElevenLabsOrderResponse>(
        "GET",
        `/v1/productions/orders/${encodeURIComponent(orderId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/productions/orders/{orderId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/update
  const updateOrder = Object.assign(
    async (
      orderId: string,
      req: ElevenLabsUpdateOrderRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateOrderResponse> => {
      return makeJsonRequest<ElevenLabsUpdateOrderResponse>(
        "PATCH",
        `/v1/productions/orders/${encodeURIComponent(orderId)}`,
        { request: req },
        signal
      );
    },
    { schema: ElevenLabsUpdateOrderRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/submit
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/submit
  const submitOrder = Object.assign(
    async (
      orderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSubmitOrderResponse> => {
      return makeJsonRequest<ElevenLabsSubmitOrderResponse>(
        "POST",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/submit`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/deliverables
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/deliverables
  const getOrderDeliverables = Object.assign(
    async (
      orderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderDeliverablesResponse> => {
      return makeJsonRequest<ElevenLabsOrderDeliverablesResponse>(
        "GET",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/deliverables`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/items
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/items/upsert
  const upsertOrderItem = Object.assign(
    async (
      orderId: string,
      req: ElevenLabsUpsertOrderItemRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpsertOrderItemResponse> => {
      return makeJsonRequest<ElevenLabsUpsertOrderItemResponse>(
        "POST",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/items`,
        { request: req },
        signal
      );
    },
    { schema: ElevenLabsUpsertOrderItemRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/productions/orders/{orderId}/items/{itemId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/items/remove
  const removeOrderItem = Object.assign(
    async (
      orderId: string,
      itemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsRemoveOrderItemResponse> => {
      return makeJsonRequest<ElevenLabsRemoveOrderItemResponse>(
        "DELETE",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/media
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/media/register
  const registerOrderMedia = Object.assign(
    async (
      orderId: string,
      req: ElevenLabsRegisterOrderMediaRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsRegisterOrderMediaResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }
      return makeMultipartJsonRequest<ElevenLabsRegisterOrderMediaResponse>(
        `/v1/productions/orders/${encodeURIComponent(orderId)}/media`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsRegisterOrderMediaRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/media/{mediaId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/media/get
  const getOrderMedia = Object.assign(
    async (
      orderId: string,
      mediaId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderMediaResponse> => {
      return makeJsonRequest<ElevenLabsOrderMediaResponse>(
        "GET",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/media/${encodeURIComponent(mediaId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/languages/{orderItemKind}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/languages
  const getOrderLanguages = Object.assign(
    async (
      orderItemKind: ElevenLabsOrderItemKind,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderLanguagesResponse> => {
      return makeJsonRequest<ElevenLabsOrderLanguagesResponse>(
        "GET",
        `/v1/productions/orders/languages/${encodeURIComponent(orderItemKind)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const productionsOrders = {
    list: listOrders,
    create: createOrder,
    get: getOrder,
    update: updateOrder,
    submit: submitOrder,
    deliverables: getOrderDeliverables,
    items: {
      upsert: upsertOrderItem,
      remove: removeOrderItem,
    },
    media: {
      register: registerOrderMedia,
      get: getOrderMedia,
    },
    languages: getOrderLanguages,
  };

  const productions = {
    orders: productionsOrders,
  };

  return {
    v1: { productions },
    get: {
      v1: {
        productions: {
          orders: {
            list: listOrders,
            get: getOrder,
            deliverables: getOrderDeliverables,
            languages: getOrderLanguages,
            media: { get: getOrderMedia },
          },
        },
      },
    },
    post: {
      v1: {
        productions: {
          orders: {
            create: createOrder,
            submit: submitOrder,
            items: { upsert: upsertOrderItem },
            media: { register: registerOrderMedia },
          },
        },
      },
    },
    patch: { v1: { productions: { orders: { update: updateOrder } } } },
    delete: {
      v1: { productions: { orders: { items: { remove: removeOrderItem } } } },
    },
  };
}
