import { LoginForm } from "@/app/components/login-form";
import { loginAdmin } from "@/lib/auth/actions";
import { redirectAuthenticatedAccount } from "@/lib/auth/guards";

export default async function AdminLoginPage() {
  await redirectAuthenticatedAccount();

  return (
    <LoginForm
      action={loginAdmin}
      fieldName="username"
      fieldLabel="Tên đăng nhập"
      heading="Đăng nhập quản trị"
      passwordLabel="Mật khẩu"
    />
  );
}
