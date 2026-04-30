'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Users, 
  Download, 
  Filter,
  Loader2,
  TrendingUp,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
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
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/reports`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Business Reports</h1>
          <p className="text-slate-500 mt-1">Comprehensive analysis of your business performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Firm */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue by Firm</h3>
              <p className="text-sm text-slate-500">Contribution of each business entity</p>
            </div>
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByFirm}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quote Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Conversion Pipeline</h3>
              <p className="text-sm text-slate-500">Quotation status distribution</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.quotesByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.quotesByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Top Customers</h3>
              <p className="text-sm text-slate-500">Clients with highest transaction value</p>
            </div>
            <Users className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-sm font-bold text-slate-500">Customer Name</th>
                  <th className="pb-4 text-sm font-bold text-slate-500">Quotes</th>
                  <th className="pb-4 text-sm font-bold text-slate-500 text-right">Total Value</th>
                  <th className="pb-4 text-sm font-bold text-slate-500 text-right">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.topCustomers.map((cust: any, index: number) => (
                  <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-slate-900">{cust.name}</td>
                    <td className="py-4 text-slate-500">{cust.count} Quotes</td>
                    <td className="py-4 text-right font-black text-slate-900">₹{cust.total.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        ₹{(cust.total / cust.count).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
