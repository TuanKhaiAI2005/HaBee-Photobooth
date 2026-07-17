export type AdminActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export const initialAdminActionState: AdminActionState = {};

export function actionError(message = "Không thể thực hiện thao tác."): AdminActionState {
  return { error: message };
}

export function actionOk(message?: string): AdminActionState {
  return { ok: true, message };
}
