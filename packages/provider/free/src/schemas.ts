import type { PayloadSchema } from "./types";

export const tmpfilesUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/api/v1/upload",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description:
        "The file to upload (Blob or File). Auto-deleted after 60 minutes.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
  },
};

export const uguuUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/upload",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description:
        "The file to upload (Blob or File). 128 MiB max. Expires after 3 hours.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
  },
};

export const catboxUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/user/api.php",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description:
        "The file to upload (Blob or File). 200 MB max. Stored permanently.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
  },
};

export const litterboxUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/resources/internals/api.php",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "The file to upload (Blob or File). 1 GB max.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
    time: {
      type: "string",
      description: "Retention time: 1h, 12h, 24h, or 72h (default 1h).",
      enum: ["1h", "12h", "24h", "72h"],
    },
  },
};

export const gofileUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/uploadfile",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description:
        "The file to upload (Blob or File). Free tier: 10-day retention.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
  },
};

export const filebinUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/{bin}/{filename}",
  contentType: "application/json",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "The file to upload (Blob or File). Expires after ~1 week.",
    },
    filename: {
      type: "string",
      description: "Filename for the upload (defaults to 'upload').",
    },
    bin: {
      type: "string",
      description: "Bin name to group files (auto-generated if omitted).",
    },
  },
};

export const tempshUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/upload",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "The file to upload (Blob or File). Expires after 3 days.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
  },
};

export const tflinkUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/api/upload",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description:
        "The file to upload (Blob or File). 100 MB max. Anonymous uploads auto-delete after 7 days.",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload.",
    },
  },
};
