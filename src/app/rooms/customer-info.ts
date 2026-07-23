export const customerInfoStorageKey = "photobooth.customerInfo";

export type StoredCustomerInfo = {
  customerName: string;
  phone: string;
};

export function normalizeCustomerName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateCustomerName(value: string): string | null {
  const normalized = normalizeCustomerName(value);

  if (!normalized) {
    return "Vui lòng nhập họ và tên.";
  }

  if (normalized.length > 100) {
    return "Họ và tên không được quá 100 ký tự.";
  }

  return null;
}

export function validateCustomerPhone(value: string): string | null {
  const phone = value.trim();

  if (!phone) {
    return "Vui lòng nhập số điện thoại.";
  }

  if (!/^\d+$/.test(phone)) {
    return "Số điện thoại chỉ được gồm chữ số.";
  }

  if (phone.length < 9 || phone.length > 11) {
    return "Số điện thoại phải có 9-11 chữ số.";
  }

  return null;
}

export function validateCustomerInfo(info: StoredCustomerInfo) {
  return {
    customerName: validateCustomerName(info.customerName),
    phone: validateCustomerPhone(info.phone),
  };
}

export function hasValidCustomerInfo(info: StoredCustomerInfo): boolean {
  const errors = validateCustomerInfo(info);
  return !errors.customerName && !errors.phone;
}
