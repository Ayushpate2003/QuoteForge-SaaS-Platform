import Link from 'next/link';
import { FileText, Shield, Zap, ArrowRight, BarChart3, Users } from 'lucide-react';

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight italic">QuoteForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
              Login to Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />
        <div className="max-w-5xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            Empowering Your Business Quotations
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Professional Quotations <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              In Seconds
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The all-in-one GST quotation software designed for multi-firm management. 
            Automate your billing, track status, and generate premium PDFs instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="group w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-4 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Built for Growing Businesses</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Powerful tools to handle every aspect of your sales cycle.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="GST Compliance"
              description="Automatic GST calculations for IGST, CGST, and SGST based on firm location."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Instant PDF"
              description="Generate pixel-perfect PDF quotations with customizable themes and layouts."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Deep Analytics"
              description="Monitor conversion rates, sales performance, and popular items in real-time."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6" />}
              title="Multi-Firm"
              description="Manage multiple legal entities and firms under a single unified dashboard."
            />
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <FileText className="w-5 h-5" />
            <span className="font-bold tracking-tight">QuoteForge &copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
