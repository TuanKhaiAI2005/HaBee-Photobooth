import { LoginForm } from "@/app/components/login-form";
import { loginStaff } from "@/lib/auth/actions";
import { redirectAuthenticatedAccount } from "@/lib/auth/guards";

export default async function StaffLoginPage() {
  await redirectAuthenticatedAccount();

  return (
    <LoginForm
      action={loginStaff}
      fieldName="employeeUid"
      fieldLabel="UID nhân viên"
      heading="Đăng nhập nhân viên"
      passwordLabel="PIN hoặc mật khẩu"
    />
  );
}
