"use client";

import { useActionState } from "react";
import { BrandMark } from "@/app/components/brand-mark";
import type { LoginActionState } from "@/lib/auth/actions";

type LoginFormProps = {
  action: (state: LoginActionState, formData: FormData) => Promise<LoginActionState>;
  fieldName: string;
  fieldLabel: string;
  heading: string;
  passwordLabel: string;
};

const initialState: LoginActionState = {};

export function LoginForm({ action, fieldName, fieldLabel, heading, passwordLabel }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <form action={formAction} className="photo-card habee-decor grid w-full max-w-md gap-4">
        <div>
          <BrandMark compact />
          <p className="photo-badge mt-4">HaBee access</p>
        </div>
        <h1 className="text-3xl font-black text-[var(--color-ink)]">{heading}</h1>
        <label className="grid gap-2 text-sm font-medium text-[var(--color-navy)]">
          {fieldLabel}
          <input
            className="photo-input"
            maxLength={64}
            name={fieldName}
            required
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--color-navy)]">
          {passwordLabel}
          <input
            className="photo-input"
            maxLength={128}
            name="password"
            required
            type="password"
          />
        </label>
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <button
          className="photo-nav-link"
          disabled={pending}
          type="submit"
        >
          Đăng nhập
        </button>
      </form>
    </main>
  );
}



