import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, icon: Icon }: { title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ElementType }) => (
  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <div className="p-2 bg-indigo-50 rounded-lg"><Icon className="w-5 h-5 text-indigo-600" /></div>}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 bg-slate-50 border-t border-slate-100 ${className}`}>
    {children}
  </div>
);
