"use client";

import { ConfirmForm } from "@/app/components/confirm-form";
import { CustomerInfoGate } from "@/app/rooms/customer-info-gate";
import { createTicketAction } from "@/lib/public/actions";

type TicketRegistrationFormProps = {
  publicToken: string;
};

const notificationSoundUrl = "/nhachuong.mp3";

function enableCustomerNotificationSound(): void {
  localStorage.setItem("photoSoundEnabled", "1");

  if (typeof Audio === "undefined") {
    return;
  }

  const audio = new Audio(notificationSoundUrl);
  audio.muted = true;
  audio.currentTime = 0;
  void audio.play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
    })
    .catch(() => {
      // Some browsers still block audio; the saved preference keeps the UI enabled.
    });
}

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
            onConfirmedSubmit={enableCustomerNotificationSound}
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
