import { baseApi } from './baseApi';
import { UPLOADTHING_URL } from '../constants/config';
import type { UploadThingNewPresignedUrl, UploadThingUploadActionPayload } from '../types/upload.types';

type InitUploadArgs = {
  files: UploadThingUploadActionPayload['files'];
};

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initImageUpload: builder.mutation<UploadThingNewPresignedUrl[], InitUploadArgs>({
      query: ({ files }) => ({
        url: `${UPLOADTHING_URL}?actionType=upload&slug=imageUploader`,
        method: 'POST',
        headers: {
          'x-uploadthing-package': 'kada-mandiya-mobile',
          'x-uploadthing-version': 'mobile',
        },
        body: { files, input: null } satisfies UploadThingUploadActionPayload,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useInitImageUploadMutation } = uploadApi;
