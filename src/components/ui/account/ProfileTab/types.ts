export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
}

export interface FormErrors {
  fullName?: string;
  phone?: string;
}

export const VALIDATION = {
  fullName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\p{M}\s'-]+$/u,
  },
  phone: {
    pattern: /^[\d\s\-+()]{7,20}$/,
  },
};
