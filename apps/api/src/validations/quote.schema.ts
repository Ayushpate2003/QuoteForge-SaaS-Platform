import { z } from 'zod';

export const quoteSchema = z.object({
  firm_id: z.string().uuid(),
  template_id: z.string().uuid(),
  quote_date: z.string().or(z.date()),
  bill_to: z.object({
    name: z.string().min(1, 'Customer name is required'),
    address: z.string().optional(),
    gstin: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
  }),
  ship_to: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    hsn_sac: z.string().optional(),
    qty: z.number().positive(),
    rate: z.number().nonnegative(),
    condition: z.string().optional(),
    cgst_rate: z.number().default(9),
    sgst_rate: z.number().default(9),
    igst_rate: z.number().default(0),
    cgst_amount: z.number().optional(),
    sgst_amount: z.number().optional(),
    igst_amount: z.number().optional(),
    taxable_amount: z.number().optional(),
    total: z.number().optional(),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative(),
  total_cgst: z.number().nonnegative().optional(),
  total_sgst: z.number().nonnegative().optional(),
  total_igst: z.number().nonnegative().optional(),
  grand_total: z.number().nonnegative(),
  notes: z.string().optional(),
  shipping_method: z.string().optional(),
  order_from: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']),
});
