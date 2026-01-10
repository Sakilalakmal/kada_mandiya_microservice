export type VendorApplication = {
  storeName: string;
  description?: string;
  phone?: string;
  address?: string;
  shopImageUrl?: string;
};

export type VendorProfile = {
  id: string;
  userId: string;
  email: string | null;
  storeName: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  shopImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VendorStatus = 'ACTIVE';

export type BecomeVendorResponse = {
  ok: true;
  message: string;
  vendor: VendorProfile;
};

export type GetMyVendorProfileResponse = {
  ok: true;
  vendor: VendorProfile | null;
};

