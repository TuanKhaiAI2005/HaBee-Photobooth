"use client";

import { ConfirmForm } from "@/app/components/confirm-form";
import { CustomerInfoGate } from "@/app/rooms/customer-info-gate";
import { createTicketAction } from "@/lib/public/actions";

type TicketRegistrationFormProps = {
  publicToken: string;
};

export function TicketRegistrationForm({ publicToken }: TicketRegistrationFormProps) {
  return (
    <CustomerInfoGate>
      {(customerInfo, changeInfoButton) => (
        <div className="grid gap-4">
          <div className="photo-stat flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold">Khách hàng: {customerInfo.customerName} - {customerInfo.phone}</p>
            {changeInfoButton}
          </div>
          <ConfirmForm
            action={createTicketAction}
            className="grid gap-4"
            confirmMessage="Xác nhận đăng ký vào hàng đợi?"
            pendingLabel="Đang đăng ký..."
            submitLabel="Đăng ký"
          >
            <input name="publicToken" type="hidden" value={publicToken} />
            <input name="customerName" type="hidden" value={customerInfo.customerName} />
            <input name="phone" type="hidden" value={customerInfo.phone} />
          </ConfirmForm>
        </div>
      )}
    </CustomerInfoGate>
  );
}
