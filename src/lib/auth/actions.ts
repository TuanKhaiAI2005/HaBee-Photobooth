"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "../../../auth";
import { adminLoginSchema, staffLoginSchema } from "@/lib/auth/schemas";

export type LoginActionState = {
  error?: string;
};

const genericLoginError = "Thông tin đăng nhập không hợp lệ.";

export async function loginAdmin(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = adminLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: genericLoginError };
  }

  try {
    await signIn("admin-login", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: genericLoginError };
    }

    throw error;
  }

  redirect("/admin");
}

export async function loginStaff(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = staffLoginSchema.safeParse({
    employeeUid: formData.get("employeeUid"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: genericLoginError };
  }

  try {
    await signIn("staff-login", {
      employeeUid: parsed.data.employeeUid,
      password: parsed.data.password,
      redirectTo: "/staff",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: genericLoginError };
    }

    throw error;
  }

  redirect("/staff");
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}


