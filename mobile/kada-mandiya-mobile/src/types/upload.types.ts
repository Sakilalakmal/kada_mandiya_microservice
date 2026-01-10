export type UploadThingActionType = 'upload';

export type UploadThingFileUploadData = {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
};

export type UploadThingUploadActionPayload = {
  files: UploadThingFileUploadData[];
  input: unknown | null;
};

export type UploadThingNewPresignedUrl = {
  url: string;
  key: string;
  customId: string | null;
  name: string;
};

export type UploadThingPutResponse = {
  url?: string;
  appUrl?: string;
  ufsUrl?: string;
  fileHash?: string;
  serverData?: unknown;
  error?: unknown;
};

