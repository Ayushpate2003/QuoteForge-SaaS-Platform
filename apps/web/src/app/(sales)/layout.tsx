import Link from 'next/link';

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">QuoteForge</h2>
        <nav className="flex space-x-6 items-center">
          <Link href="/sales/dashboard" className="text-slate-600 hover:text-slate-900 font-medium">Dashboard</Link>
          <Link href="/sales/quotes/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md active:scale-95">New Quote</Link>
          <button className="text-slate-500 hover:text-slate-900">Logout</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
