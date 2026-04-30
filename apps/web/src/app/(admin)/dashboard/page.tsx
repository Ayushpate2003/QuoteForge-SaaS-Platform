'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Calendar,
  IndianRupee,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let accessToken = session?.access_token;
      if (!accessToken) {
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.refreshSession();
        accessToken = refreshedSession?.access_token;
      }

      if (!accessToken) {
        throw new Error('No active session. Please login again.');
      }

      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

      // Retry once after a refresh if the first token is expired.
      if (response.status === 401) {
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.refreshSession();

        if (!refreshedSession?.access_token) {
          throw new Error('Session expired. Please login again.');
        }

        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/stats`, {
          headers: {
            Authorization: `Bearer ${refreshedSession.access_token}`,
          },
        });
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Failed to fetch stats');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl border border-rose-200 bg-rose-50">
        <h2 className="text-lg font-semibold text-rose-800">Unable to load dashboard stats</h2>
        <p className="text-sm text-rose-700 mt-2">{error || 'No dashboard data found.'}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const COLORS = ['#64748b', '#3b82f6', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your quotations today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Last 30 Days</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Quotations" 
          value={data.stats.totalQuotes} 
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          trend="+12%"
          trendUp={true}
          gradient="from-indigo-50 to-white"
        />
        <StatCard 
          title="Total Value" 
          value={`₹${(data.stats.totalValue / 100000).toFixed(2)}L`} 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          trend="+8.4%"
          trendUp={true}
          gradient="from-emerald-50 to-white"
        />
        <StatCard 
          title="Conversion Value" 
          value={`₹${(data.stats.acceptedValue / 100000).toFixed(2)}L`} 
          icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
          trend="+5.2%"
          trendUp={true}
          gradient="from-blue-50 to-white"
        />
        <StatCard 
          title="Pending Quotes" 
          value={data.stats.pendingQuotes} 
          icon={<ClockIcon className="w-5 h-5 text-amber-600" />}
          trend="-2.1%"
          trendUp={false}
          gradient="from-amber-50 to-white"
        />
        <StatCard 
          title="Overdue (3d+)" 
          value={data.stats.staleQuotesCount} 
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          trend={data.stats.staleQuotesCount > 0 ? "Requires Action" : "All Clear"}
          trendUp={data.stats.staleQuotesCount === 0}
          gradient="from-rose-50 to-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Performance</h3>
              <p className="text-sm text-slate-500">Monthly breakdown of quotation values</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-600">Total Value</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySales}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Quote Distribution</h3>
          <p className="text-sm text-slate-500 mb-8">Success rate by status</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-sm font-bold text-emerald-900">Win Rate</span>
              <span className="text-lg font-black text-emerald-600">
                {((data.statusDistribution.find((s:any) => s.name === 'Accepted')?.value || 0) / data.stats.totalQuotes * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, gradient }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md group`}>
      <div className="flex items-start justify-between">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</h4>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
