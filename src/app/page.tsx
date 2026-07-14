const checklist = [
  "Next.js App Router",
  "TypeScript strict mode",
  "Tailwind CSS",
  "Prisma 6.x và Supabase PostgreSQL",
  "Auth.js Credentials, Zod, bcrypt",
  "Vitest và ESLint",
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <section className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="border-b border-neutral-300 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
            Photobooth Queue
          </p>
          <h1 className="mt-3 text-4xl font-bold text-neutral-950 sm:text-5xl">
            Nền móng quản lý hàng đợi photobooth
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
            Project đã sẵn sàng để phát triển theo từng sprint nhỏ cho một chi
            nhánh photobooth có 2-3 phòng.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {checklist.map((item) => (
            <div
              className="rounded border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
