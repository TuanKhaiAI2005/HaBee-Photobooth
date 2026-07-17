import QRCode from "qrcode";

export function getAppBaseUrl(): string {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Thiếu APP_URL hoặc NEXT_PUBLIC_APP_URL để tạo QR production.");
    }

    return "http://localhost:3000";
  }

  const url = new URL(configured);
  const baseUrl = url.toString().replace(/\/$/, "");

  if (process.env.NODE_ENV === "production" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("APP_URL production không được trỏ về localhost.");
  }

  return baseUrl;
}

export function getJoinPublicUrl(): string {
  return `${getAppBaseUrl()}/join`;
}

export function getRoomPublicUrl(publicToken: string): string {
  return `${getAppBaseUrl()}/rooms/${encodeURIComponent(publicToken)}`;
}

export async function createQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}

export async function createQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
}
