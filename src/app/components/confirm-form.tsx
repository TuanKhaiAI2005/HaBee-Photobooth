"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { AdminActionState } from "@/lib/admin/action-state";
import { initialAdminActionState } from "@/lib/admin/action-state";

type ConfirmFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  children: ReactNode;
  confirmMessage: string;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="photo-button disabled:shadow-none"
      disabled={pending}
      type="submit"
    >
      {pending ? (pendingLabel ?? "Đang xử lý...") : label}
    </button>
  );
}

export function ConfirmForm({
  action,
  children,
  confirmMessage,
  submitLabel,
  pendingLabel,
  className,
}: ConfirmFormProps) {
  const [state, formAction] = useActionState(action, initialAdminActionState);

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-700">{state.message ?? "Đã cập nhật."}</p> : null}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

