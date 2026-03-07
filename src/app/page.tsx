import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 py-20 px-8 bg-white dark:bg-black sm:items-start">
        <div className="flex items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <h1 className="text-2xl font-semibold">Employee Leave Management</h1>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 max-w-xl">
          Quick navigation to frontend areas scaffolded under{" "}
          <strong>src/frontend</strong>.
        </p>

        <nav className="grid gap-3 w-full sm:grid-cols-2 md:grid-cols-3">
          <Link
            className="rounded-md bg-zinc-900 text-white px-4 py-3 text-center"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-md bg-zinc-900 text-white px-4 py-3 text-center"
            href="/registration"
          >
            Registration
          </Link>
          <Link
            className="rounded-md bg-zinc-900 text-white px-4 py-3 text-center"
            href="/super-admin"
          >
            Super Admin
          </Link>
          <Link
            className="rounded-md bg-zinc-900 text-white px-4 py-3 text-center"
            href="/admin"
          >
            Admin
          </Link>
          <Link
            className="rounded-md bg-zinc-900 text-white px-4 py-3 text-center"
            href="/data-encoder"
          >
            Data Encoder
          </Link>
        </nav>

        <div className="mt-auto w-full text-sm text-zinc-500">
          <p>
            Files live in <code>src/frontend/*</code>. Add UI inside each area.
          </p>
        </div>
      </main>
    </div>
  );
}
