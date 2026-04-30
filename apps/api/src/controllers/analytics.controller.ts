import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    // 1. Summary Stats
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('status, grand_total, created_at')
      .eq('tenant_id', userData.tenant_id);

    if (quotesError) throw quotesError;

    const stats = {
      totalQuotes: quotes.length,
      totalValue: quotes.reduce((acc, q) => acc + q.grand_total, 0),
      acceptedValue: quotes
        .filter(q => q.status.toLowerCase() === 'accepted')
        .reduce((acc, q) => acc + q.grand_total, 0),
      pendingQuotes: quotes.filter(q => ['sent', 'draft'].includes(q.status.toLowerCase())).length,
      staleQuotesCount: quotes.filter(q => {
        const qDate = new Date(q.created_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return qDate < threeDaysAgo && ['sent', 'draft'].includes(q.status.toLowerCase());
      }).length
    };

    // 2. Sales Over Time (Last 6 Months)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    const monthlySales = last6Months.map(month => {
      const total = quotes
        .filter(q => {
          const qDate = new Date(q.created_at);
          return qDate.toLocaleString('default', { month: 'short' }) === month;
        })
        .reduce((acc, q) => acc + q.grand_total, 0);
      return { month, total };
    });

    // 3. Status Distribution
    const statusDistribution = [
      { name: 'Draft', value: quotes.filter(q => q.status.toLowerCase() === 'draft').length },
      { name: 'Sent', value: quotes.filter(q => q.status.toLowerCase() === 'sent').length },
      { name: 'Accepted', value: quotes.filter(q => q.status.toLowerCase() === 'accepted').length },
      { name: 'Rejected', value: quotes.filter(q => q.status.toLowerCase() === 'rejected').length },
    ];

    return res.status(200).json({
      stats,
      monthlySales,
      statusDistribution
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getReportData = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    // 1. Quotes with Firms
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*, firms(name)')
      .eq('tenant_id', userData.tenant_id);

    if (quotesError) throw quotesError;

    // 2. Revenue by Firm
    const firmRevenue: Record<string, number> = {};
    quotes.forEach(q => {
      const firmName = q.firms?.name || 'Unknown';
      firmRevenue[firmName] = (firmRevenue[firmName] || 0) + q.grand_total;
    });

    const revenueByFirm = Object.entries(firmRevenue).map(([name, value]) => ({ name, value }));

    // 3. Top Customers
    const customerValue: Record<string, { name: string, total: number, count: number }> = {};
    quotes.forEach(q => {
      const custName = q.bill_to?.name || 'Unknown';
      if (!customerValue[custName]) {
        customerValue[custName] = { name: custName, total: 0, count: 0 };
      }
      customerValue[custName].total += q.grand_total;
      customerValue[custName].count += 1;
    });

    const topCustomers = Object.values(customerValue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return res.status(200).json({
      revenueByFirm,
      topCustomers,
      totalQuotes: quotes.length,
      quotesByStatus: [
        { name: 'Draft', value: quotes.filter(q => q.status.toLowerCase() === 'draft').length },
        { name: 'Sent', value: quotes.filter(q => q.status.toLowerCase() === 'sent').length },
        { name: 'Accepted', value: quotes.filter(q => q.status.toLowerCase() === 'accepted').length },
        { name: 'Rejected', value: quotes.filter(q => q.status.toLowerCase() === 'rejected').length },
      ]
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
