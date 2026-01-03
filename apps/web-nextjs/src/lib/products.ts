import { apiFetch } from "@/lib/api";

export type ProductImage = {
  id: string;
  imageUrl: string;
  sortOrder: number;
};

export type ProductListItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  thumbnailImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = {
  id: string;
  vendorUserId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type ListProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
};

export type ProductListResponse = {
  ok?: boolean;
  items: ProductListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductPayload = {
  name?: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  currency?: string;
  stockQty?: number;
  images?: string[];
  isActive?: boolean;
};

export const productKeys = {
  all: ["products"] as const,
  list: (params: ListProductsParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  mine: ["products", "mine"] as const,
};

function normalizeImageUrl(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) {
    return input.trim();
  }
  return null;
}

function pickThumbnailImage(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;

  const direct =
    normalizeImageUrl(record.thumbnailImageUrl) ??
    normalizeImageUrl(record.thumbnail_image_url as string | undefined) ??
    normalizeImageUrl(record.thumbnailimageurl as string | undefined);
  if (direct) return direct;

  const images = record.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img || typeof img !== "object") continue;
      const imgRecord = img as Record<string, unknown>;
      const url =
        normalizeImageUrl(imgRecord.imageUrl) ??
        normalizeImageUrl(imgRecord.image_url) ??
        normalizeImageUrl(imgRecord.url);
      if (url) return url;
    }
  }

  return null;
}

function normalizeImages(images: unknown[] | undefined): ProductImage[] {
  if (!Array.isArray(images)) return [];

  return images
    .map((img, idx) => {
      if (!img || typeof img !== "object") return null;
      const imgRecord = img as Record<string, unknown>;
      const url =
        normalizeImageUrl(imgRecord.imageUrl) ??
        normalizeImageUrl(imgRecord.image_url) ??
        normalizeImageUrl(imgRecord.url);
      if (!url) return null;

      const sortOrderRaw = imgRecord.sortOrder ?? imgRecord.sort_order ?? idx;
      const sortOrder = Number(sortOrderRaw);
      return {
        id: String(imgRecord.id ?? idx),
        imageUrl: url,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : idx,
      };
    })
    .filter((img): img is ProductImage => Boolean(img))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildQuery(params: ListProductsParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.category?.trim()) query.set("category", params.category.trim());
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchProducts(params: ListProductsParams): Promise<ProductListResponse> {
  const query = buildQuery(params);
  const data = await apiFetch<ProductListResponse>(`/products${query}`, { method: "GET" });

  console.log('📦 Raw API response for products:', JSON.stringify(data.items?.[0], null, 2));

  const items: ProductListItem[] = (data.items ?? []).map((item) => {
    const thumbnailUrl = pickThumbnailImage(item);
    console.log('🖼️ Product:', item.name, '| Thumbnail URL:', thumbnailUrl, '| Raw item:', JSON.stringify(item, null, 2));
    return {
      ...item,
      thumbnailImageUrl: thumbnailUrl,
    };
  });

  return {
    items,
    page: Number(data.page ?? params.page ?? 1),
    limit: Number(data.limit ?? params.limit ?? 12),
    total: Number(data.total ?? 0),
    totalPages: Number(data.totalPages ?? 1),
    ok: data.ok,
  };
}

export async function fetchProductDetail(id: string): Promise<ProductDetail> {
  const data = await apiFetch<{ ok?: boolean; product?: ProductDetail }>(`/products/${id}`, {
    method: "GET",
  });

  console.log('📦 Raw API response for product detail:', JSON.stringify(data, null, 2));

  if (data?.product) {
    const productRecord = data.product as unknown as Record<string, unknown>;
    const images = normalizeImages(productRecord.images as unknown[] | undefined);
    console.log('🖼️ Normalized images:', images);
    return {
      ...data.product,
      images,
    };
  }

  throw new Error("Product not found");
}

export async function fetchMyProducts(): Promise<ProductListItem[]> {
  const data = await apiFetch<{ ok?: boolean; items?: ProductListItem[] }>("/products/mine", {
    method: "GET",
  });

  const items: ProductListItem[] = (data.items ?? []).map((item) => ({
    ...item,
    thumbnailImageUrl: pickThumbnailImage(item),
  }));

  return items;
}

export async function createProduct(input: Required<Pick<ProductPayload, "name" | "price">> & ProductPayload) {
  const payload = {
    ...input,
    images: input.images?.filter((url) => url && url.trim().length).map((url) => url.trim()) ?? [],
  };

  const data = await apiFetch<{ ok?: boolean; productId?: string }>("/products", {
    method: "POST",
    body: payload,
  });

  if (data?.productId) return data.productId;
  throw new Error("Product ID missing from response");
}

export async function updateProduct(productId: string, patch: ProductPayload) {
  const payload = {
    ...patch,
    images: patch.images?.filter((url) => url && url.trim().length).map((url) => url.trim()),
  };

  await apiFetch(`/products/${productId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deactivateProduct(productId: string) {
  await apiFetch(`/products/${productId}/deactivate`, { method: "PATCH" });
}

export async function reactivateProduct(productId: string) {
  await apiFetch(`/products/${productId}/reactivate`, { method: "PATCH" });
}
