import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      {/* Header */}
      <header className="border-b border-[#18181B]">
        <div className="max-w-[720px] mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="text-[16px] font-bold tracking-[0.2em] text-white hover:opacity-80 transition-opacity"
          >
            PHANTOM
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[720px] mx-auto px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#18181B] py-8">
        <div className="max-w-[720px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-[#3F3F46] font-mono">
            &copy; {new Date().getFullYear()} Phantom. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[11px] text-[#3F3F46] hover:text-[#71717A] font-mono transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-[11px] text-[#3F3F46] hover:text-[#71717A] font-mono transition-colors">
              Terms
            </Link>
            <Link href="/imprint" className="text-[11px] text-[#3F3F46] hover:text-[#71717A] font-mono transition-colors">
              Imprint
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
