import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <nav className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              OH
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">OurHomegroup</h1>
              <p className="text-xs text-zinc-500 -mt-1">Recovery &amp; Support</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/meetings" className="hover:text-teal-600">
              Meetings
            </Link>
            <Link href="/dashboard" className="hover:text-teal-600">
              Dashboard
            </Link>
            <Link href="/admin" className="hover:text-teal-600">
              Admin
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-teal-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-teal-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-teal-50 to-white dark:from-zinc-900 dark:to-zinc-950 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-4 py-1 rounded-full text-sm mb-6">
            Hybrid Live Meetings · Multi-tenant
          </div>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-6">
            Find Your Support.<br />Join Safely.
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-10">
            Privacy-first recovery meetings with LiveKit primary engine and optional Zoom fallback.
            Role-based access, attendance, and organization isolation.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/meetings"
              className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-lg font-medium hover:bg-teal-700"
            >
              Browse Meetings
            </Link>
            <Link
              href="/dashboard"
              className="border border-zinc-300 dark:border-zinc-700 px-8 py-3.5 rounded-2xl text-lg font-medium"
            >
              Member Dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-12 text-center text-sm text-zinc-500">
        OurHomegroup™ · LiveKit + Zoom Hybrid · Clerk Auth · Multi-tenant Scaffold
      </footer>
    </div>
  );
}
