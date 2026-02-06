export const MAX_ADDRESSES = 5;

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressFormData {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface FormErrors {
  label?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export const INITIAL_FORM_DATA: AddressFormData = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
};

// Validation patterns
export const VALIDATION = {
  label: { maxLength: 50 },
  postalCode: { pattern: /^\d{5}(-\d{4})?$/ },
  state: { pattern: /^[A-Za-z]{2}$/ },
};
