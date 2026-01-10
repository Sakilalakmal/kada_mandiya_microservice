import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { uploadApi } from '../api/uploadApi';
import { store } from '../store';
import type {
  UploadThingNewPresignedUrl,
  UploadThingPutResponse,
  UploadThingUploadActionPayload,
} from '../types/upload.types';
import { getApiErrorMessage } from './apiError';

type UploadProgress = {
  loaded: number;
  total: number;
  progress: number; // 0..1
};

type UploadOptions = {
  onProgress?: (progress: UploadProgress) => void;
};

function createLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function guessFileName(asset: ImagePicker.ImagePickerAsset): string {
  const base = asset.fileName?.trim();
  if (base) return base;
  const ext = asset.uri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  return `photo-${createLocalId()}.${ext}`;
}

function guessMimeType(asset: ImagePicker.ImagePickerAsset): string {
  const fromPicker = asset.mimeType?.trim();
  if (fromPicker) return fromPicker;
  if (asset.uri.toLowerCase().endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

async function getFileSize(uri: string, fallback?: number): Promise<number> {
  if (typeof fallback === 'number' && Number.isFinite(fallback) && fallback >= 0) return fallback;
  const info = await FileSystem.getInfoAsync(uri);
  const size = (info as any)?.size as number | undefined;
  if (typeof size === 'number' && Number.isFinite(size) && size >= 0) return size;
  return 0;
}

async function headRangeStart(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const raw = res.headers.get('x-ut-range-start');
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

function putFileWithProgress(args: {
  url: string;
  file: { uri: string; name: string; type: string; size: number; lastModified?: number };
  rangeStart: number;
  onProgress?: UploadOptions['onProgress'];
}): Promise<UploadThingPutResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', args.url, true);
    xhr.setRequestHeader('Range', `bytes=${args.rangeStart}-`);
    xhr.responseType = 'json';

    let previousLoaded = 0;
    xhr.upload.onprogress = (event) => {
      const loaded = typeof event.loaded === 'number' ? event.loaded : 0;
      const delta = loaded - previousLoaded;
      previousLoaded = loaded;

      const absoluteLoaded = args.rangeStart + loaded;
      const total = Math.max(1, args.file.size);
      const progress = Math.max(0, Math.min(1, absoluteLoaded / total));

      if (delta >= 0) args.onProgress?.({ loaded: absoluteLoaded, total, progress });
    };

    xhr.onerror = () => {
      reject(new Error('Upload failed (network error).'));
    };

    xhr.onload = () => {
      const status = xhr.status;
      if (status < 200 || status >= 300) {
        reject(new Error(`Upload failed (HTTP ${status}).`));
        return;
      }

      const json = xhr.response as UploadThingPutResponse | null;
      if (json && typeof json === 'object') resolve(json);
      else resolve({});
    };

    const formData = new FormData();
    formData.append('file', {
      uri: args.file.uri,
      type: args.file.type,
      name: args.file.name,
      ...(args.rangeStart > 0 ? { range: args.rangeStart } : {}),
    } as any);

    xhr.send(formData);
  });
}

export async function pickImages(options?: { max?: number }) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to add images.');
  }

  const max = Math.max(1, Math.min(8, options?.max ?? 8));

  const baseOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    exif: false,
  };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      ...baseOptions,
      allowsMultipleSelection: true,
      selectionLimit: max,
    });
    return result.canceled ? [] : (result.assets ?? []);
  } catch {
    const result = await ImagePicker.launchImageLibraryAsync({
      ...baseOptions,
      allowsMultipleSelection: false,
    });
    return result.canceled ? [] : (result.assets ?? []);
  }
}

export async function uploadImageAsync(asset: ImagePicker.ImagePickerAsset, options?: UploadOptions) {
  const name = guessFileName(asset);
  const type = guessMimeType(asset);
  const size = await getFileSize(asset.uri, asset.fileSize);

  const maxBytes = 4 * 1024 * 1024;
  if (size > maxBytes) {
    throw new Error('Image is too large (max 4MB). Choose a smaller image.');
  }

  const files: UploadThingUploadActionPayload['files'] = [
    { name, type, size, lastModified: Date.now() },
  ];

  let presigned: UploadThingNewPresignedUrl[];
  try {
    presigned = await store.dispatch(uploadApi.endpoints.initImageUpload.initiate({ files })).unwrap();
  } catch (err) {
    throw new Error(`Upload init failed: ${getApiErrorMessage(err)}`);
  }
  const first = presigned[0];
  if (!first?.url) throw new Error('Upload init failed: missing upload URL.');

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const rangeStart = await headRangeStart(first.url);
      const put = await putFileWithProgress({
        url: first.url,
        file: { uri: asset.uri, name, type, size, lastModified: Date.now() },
        rangeStart,
        onProgress: options?.onProgress,
      });

      if (put?.error) {
        throw new Error(typeof put.error === 'string' ? put.error : 'Upload failed.');
      }

      const publicUrl = put.ufsUrl ?? put.url ?? put.appUrl;
      if (!publicUrl || typeof publicUrl !== 'string') {
        throw new Error('Upload failed: missing public URL.');
      }

      return { url: publicUrl };
    } catch (err) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      throw err instanceof Error ? err : new Error('Upload failed.');
    }
  }

  throw new Error('Upload failed.');
}
