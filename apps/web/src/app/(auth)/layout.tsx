import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900 px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />
      
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-200 relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              <FileText className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight italic">QuoteForge</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
