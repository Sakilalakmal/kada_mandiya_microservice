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

export type ProductImage = {
  id: string;
  imageUrl: string;
  sortOrder: number;
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

export type GetProductDetailResponse = {
  ok: true;
  product: ProductDetail;
};

export type UpdateProductRequest = {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  stockQty?: number;
  isActive?: boolean;
  images?: string[];
};

export type UpdateProductResponse = {
  ok: true;
  message: string;
};

export type ToggleProductResponse = {
  ok: true;
  message: string;
};

