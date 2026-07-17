import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminNav } from "@/app/admin/admin-nav";
import { ConfirmForm } from "@/app/components/confirm-form";
import {
  createStaffAction,
  deleteStaffAction,
  resetStaffPasswordAction,
  setStaffActiveAction,
} from "@/lib/admin/staff-actions";

export default async function AdminStaffPage() {
  await requireAdmin();

  const staffAccounts = await prisma.account.findMany({
    where: { role: "STAFF" },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      employeeUid: true,
      fullName: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 px-6 py-8">
      <AdminNav />
      <section>
        <p className="text-sm font-semibold uppercase text-[var(--color-muted-text)]">Quản lý nhân viên</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-navy)]">Tài khoản nhân viên</h1>
      </section>

      <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-xl font-semibold">Tạo nhân viên</h2>
        <ConfirmForm
          action={createStaffAction}
          className="mt-4 grid gap-4 sm:grid-cols-3"
          confirmMessage="Xác nhận tạo nhân viên mới?"
          pendingLabel="Đang tạo..."
          submitLabel="Tạo nhân viên"
        >
          <label className="grid gap-2 text-sm font-medium">
            Họ tên
            <input className="rounded border border-[var(--color-border)] px-3 py-2" name="fullName" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            PIN hoặc mật khẩu ban đầu
            <input className="rounded border border-[var(--color-border)] px-3 py-2" name="password" required type="password" minLength={4} />
          </label>
        </ConfirmForm>
      </section>

      <section className="grid gap-4">
        {staffAccounts.length === 0 ? (
          <div className="rounded border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-muted-text)]">
            Chưa có nhân viên nào.
          </div>
        ) : (
          staffAccounts.map((staff) => (
            <article className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5" key={staff.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{staff.fullName}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted-text)]">UID: {staff.employeeUid}</p>
                  <p className="text-sm text-[var(--color-muted-text)]">
                    Lần đăng nhập cuối: {staff.lastLoginAt ? staff.lastLoginAt.toLocaleString("vi-VN") : "Chưa có"}
                  </p>
                </div>
                <span className="rounded border border-[var(--color-border)] px-3 py-1 text-sm">
                  {staff.isActive ? "Đang hoạt động" : "Đã khóa"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <ConfirmForm
                  action={resetStaffPasswordAction}
                  className="grid gap-3 rounded border border-[var(--color-border)] p-4"
                  confirmMessage={`Đặt lại PIN hoặc mật khẩu cho ${staff.fullName}?`}
                  pendingLabel="Đang đặt lại..."
                  submitLabel="Đặt lại PIN/mật khẩu"
                >
                  <input name="id" type="hidden" value={staff.id} />
                  <label className="grid gap-2 text-sm font-medium">
                    PIN hoặc mật khẩu mới
                    <input className="rounded border border-[var(--color-border)] px-3 py-2" name="password" required type="password" minLength={4} />
                  </label>
                </ConfirmForm>

                <ConfirmForm
                  action={setStaffActiveAction}
                  className="flex flex-wrap items-center gap-3 rounded border border-[var(--color-border)] p-4"
                  confirmMessage={`${staff.isActive ? "Khóa" : "Mở khóa"} tài khoản ${staff.fullName}?`}
                  pendingLabel="Đang cập nhật..."
                  submitLabel={staff.isActive ? "Khóa / xóa mềm" : "Mở khóa"}
                >
                  <input name="id" type="hidden" value={staff.id} />
                  <input name="isActive" type="hidden" value={staff.isActive ? "false" : "true"} />
                </ConfirmForm>

                <ConfirmForm
                  action={deleteStaffAction}
                  className="flex flex-wrap items-center gap-3 rounded border border-[var(--color-border)] p-4"
                  confirmMessage={`Xóa vĩnh viễn tài khoản nhân viên ${staff.fullName}?`}
                  pendingLabel="Đang xóa..."
                  submitLabel="Xóa nhân viên"
                >
                  <input name="id" type="hidden" value={staff.id} />
                </ConfirmForm>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}




