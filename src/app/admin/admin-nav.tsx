import Link from "next/link";
import { BrandMark } from "@/app/components/brand-mark";
import { logout } from "@/lib/auth/actions";

export function AdminNav() {
  return (
    <nav className="photo-card-soft flex flex-wrap items-center gap-3">
      <Link className="mr-2" href="/admin">
        <BrandMark compact />
      </Link>
      <Link className="photo-nav-link" href="/admin">
        Tổng quan
      </Link>
      <Link className="photo-nav-link" href="/admin/rooms">
        Phòng
      </Link>
      <Link className="photo-nav-link" href="/admin/staff">
        Nhân viên
      </Link>
      <Link className="photo-nav-link" href="/admin/history">
        Lịch sử
      </Link>
      <form action={logout} className="ml-auto">
        <button className="photo-nav-link" type="submit">
          Đăng xuất
        </button>
      </form>
    </nav>
  );
}
