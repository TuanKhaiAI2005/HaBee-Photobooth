"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  customerInfoStorageKey,
  hasValidCustomerInfo,
  normalizeCustomerName,
  validateCustomerInfo,
  type StoredCustomerInfo,
} from "@/app/rooms/customer-info";

type CustomerInfoGateProps = {
  children: (customerInfo: StoredCustomerInfo, changeInfoButton: ReactNode) => ReactNode;
};

const emptyCustomerInfo: StoredCustomerInfo = {
  customerName: "",
  phone: "",
};

function readStoredCustomerInfo(): StoredCustomerInfo | null {
  try {
    const raw = window.localStorage.getItem(customerInfoStorageKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredCustomerInfo>;
    const info = {
      customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };

    return hasValidCustomerInfo(info) ? info : null;
  } catch {
    return null;
  }
}

export function CustomerInfoGate({ children }: CustomerInfoGateProps) {
  const [form, setForm] = useState<StoredCustomerInfo>(emptyCustomerInfo);
  const [savedInfo, setSavedInfo] = useState<StoredCustomerInfo | null>(null);
  const [touched, setTouched] = useState({ customerName: false, phone: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStoredCustomerInfo();

      if (stored) {
        setForm(stored);
        setSavedInfo(stored);
      }

      setLoaded(true);
    });
  }, []);

  const errors = useMemo(() => validateCustomerInfo(form), [form]);
  const isValid = !errors.customerName && !errors.phone;

  const changeInfoButton = (
    <button
      className="photo-button-secondary"
      type="button"
      onClick={() => {
        setSavedInfo(null);
        setTouched({ customerName: false, phone: false });
      }}
    >
      Thay đổi thông tin
    </button>
  );

  if (!loaded) {
    return (
      <section className="photo-card-soft">
        <p className="text-sm text-[var(--color-muted-text)]">Đang kiểm tra thông tin khách...</p>
      </section>
    );
  }

  if (savedInfo) {
    return children(savedInfo, changeInfoButton);
  }

  return (
    <section className="photo-card">
      <p className="photo-badge">Thông tin khách</p>
      <h2 className="mt-3 text-2xl font-black text-[var(--color-navy)]">Nhập thông tin để lấy số thứ tự</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-text)]">
        Thông tin này được dùng để xác nhận lượt và hỗ trợ khi cần liên hệ.
      </p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched({ customerName: true, phone: true });

          if (!isValid) {
            return;
          }

          const info = {
            customerName: normalizeCustomerName(form.customerName),
            phone: form.phone.trim(),
          };
          window.localStorage.setItem(customerInfoStorageKey, JSON.stringify(info));
          setForm(info);
          setSavedInfo(info);
        }}
      >
        <label className="grid gap-2 text-sm font-bold">
          Họ và tên
          <input
            className="photo-input"
            name="customerName"
            required
            value={form.customerName}
            onBlur={() => setTouched((current) => ({ ...current, customerName: true }))}
            onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
          />
          {touched.customerName && errors.customerName ? <span className="text-sm text-red-700">{errors.customerName}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Số điện thoại
          <input
            className="photo-input"
            inputMode="numeric"
            name="phone"
            pattern="[0-9]*"
            required
            value={form.phone}
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
          {touched.phone && errors.phone ? <span className="text-sm text-red-700">{errors.phone}</span> : null}
        </label>
        <div className="sm:col-span-2">
          <button className="photo-button disabled:shadow-none" disabled={!isValid} type="submit">
            Tiếp tục
          </button>
        </div>
      </form>
    </section>
  );
}
