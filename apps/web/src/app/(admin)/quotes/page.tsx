'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Eye, Edit3, Trash2, Download, FileText, Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch quotes');
      const data = await response.json();
      setQuotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return <FileText className="w-3 h-3" />;
      case 'sent': return <Clock className="w-3 h-3" />;
      case 'accepted': return <CheckCircle className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.bill_to.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const allVisibleSelected =
    filteredQuotes.length > 0 && filteredQuotes.every((quote) => selectedQuoteIds.includes(quote.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedQuoteIds((prev) => prev.filter((id) => !filteredQuotes.some((q) => q.id === id)));
      return;
    }
    setSelectedQuoteIds((prev) => {
      const visibleIds = filteredQuotes.map((q) => q.id);
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-slate-500 mt-1">Manage and track your business quotations</p>
        </div>
        <Link href="/admin/quotes/new">
          <Button className="gap-2 shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4" /> Create Quotation
          </Button>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by quote number or client..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-900 transition-all text-sm font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {selectedQuoteIds.length > 0 && (
          <div className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 inline-flex">
            {selectedQuoteIds.length} quotation{selectedQuoteIds.length > 1 ? 's' : ''} selected
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label="Select all quotations"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">Quote Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">Client</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">Firm</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-700">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-slate-400" />
                      <p>No quotations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedQuoteIds.includes(quote.id)}
                        onChange={() => toggleQuoteSelection(quote.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Select quotation ${quote.quote_number}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{quote.quote_number}</span>
                        <span className="text-xs text-slate-500">{format(new Date(quote.quote_date), 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{quote.bill_to.name}</span>
                        <span className="text-xs text-slate-500">{quote.bill_to.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{quote.firms?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">₹{quote.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/quotes/${quote.id}`}>
                          <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-rose-600 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="group-hover:hidden text-slate-300">
                        <MoreVertical className="w-4 h-4 ml-auto" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
