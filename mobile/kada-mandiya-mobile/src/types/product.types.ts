export type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  thumbnailImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductRequest = {
  name: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  stockQty?: number;
  images?: string[];
};

export type CreateProductResponse = {
  ok: true;
  productId: string;
};

export type GetMyProductsResponse = {
  ok: true;
  items: Product[];
};

