import React from 'react';
import { QuotationDocument } from '../Shared/QuotationDocument';

interface TemplateConfig {
  accentColor: string;
  fontFamily: string;
  showCondition: boolean;
  showHSN: boolean;
  showDescription: boolean;
  headerText: string;
  footerText: string;
  terms: string[];
}

interface PreviewProps {
  config: TemplateConfig;
}

export const TemplatePreview: React.FC<PreviewProps> = ({ config }) => {
  // Mock data for template preview
  const mockFirm = {
    name: 'Your Business Name',
    address: '123 Business Street, Tech Park, Mumbai, Maharashtra - 400001',
    gstin: '27XXXXX0000X1Z5',
    phone: '+91 98765 43210',
    email: 'contact@yourbusiness.com'
  };

  const mockClient = {
    name: 'Client Company Name',
    address: '456 Client Avenue, Corporate Zone, Pune, Maharashtra - 411001',
    gstin: '27YYYYY0000Y1Z5',
    phone: '+91 90000 11111'
  };

  const mockItems = [
    {
      id: '1',
      name: 'Premium Enterprise Laptop',
      description: 'Intel i7, 16GB RAM, 512GB SSD, Windows 11 Pro',
      hsn_code: '8471',
      qty: 2,
      rate: 65000,
      cgst_rate: 9,
      sgst_rate: 9,
      taxable_amount: 130000,
      cgst_amount: 11700,
      sgst_amount: 11700,
      igst_amount: 0,
      total_amount: 153400
    },
    {
      id: '2',
      name: 'Wireless Mechanical Keyboard',
      description: 'RGB Backlit, Brown Switches',
      hsn_code: '8471',
      qty: 5,
      rate: 4500,
      cgst_rate: 9,
      sgst_rate: 9,
      taxable_amount: 22500,
      cgst_amount: 2025,
      sgst_amount: 2025,
      igst_amount: 0,
      total_amount: 26550
    }
  ];

  const summary = {
    subtotal: 152500,
    total_cgst: 13725,
    total_sgst: 13725,
    total_igst: 0,
    grand_total: 179950
  };

  return (
    <div className="scale-[0.8] origin-top md:scale-100 flex justify-center">
      <QuotationDocument 
        firm={mockFirm}
        template={{ config }}
        client={mockClient}
        items={mockItems}
        summary={summary}
        quoteDate={new Date().toISOString()}
        quoteNo="QT/2024/001"
      />
    </div>
  );
};
