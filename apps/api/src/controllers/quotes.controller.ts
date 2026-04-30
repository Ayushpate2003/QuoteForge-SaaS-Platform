import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { sendQuotationEmail } from '../services/email.service';
import { PdfService } from '../services/pdf.service';

import { uploadToSupabase } from '../services/storage.service';

export const getQuotes = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*, firms(name)')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(quotes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createQuote = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const quoteData = req.body;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    // 1. Generate Quote Number
    const { data: sequence, error: seqError } = await supabase
      .from('quote_sequences')
      .select('*')
      .eq('firm_id', quoteData.firm_id)
      .single();

    if (seqError) throw seqError;

    const nextNumber = sequence.last_number + 1;
    const quoteNumber = `${sequence.prefix}/${new Date().getFullYear()}/${nextNumber.toString().padStart(3, '0')}`;

    // 2. Insert Quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        ...quoteData,
        tenant_id: userData.tenant_id,
        quote_number: quoteNumber,
        created_by: user.id
      }])
      .select()
      .single();

    if (quoteError) throw quoteError;

    // 2.5 Log Audit
    await logAudit({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      action: 'QUOTE_CREATED',
      resource_type: 'quotes',
      resource_id: quote.id,
      new_values: quote
    });

    // 3. Update Sequence
    await supabase
      .from('quote_sequences')
      .update({ last_number: nextNumber })
      .eq('firm_id', quoteData.firm_id);

    return res.status(201).json(quote);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateQuoteStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log Audit
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', req.user.id)
      .single();

    if (userData) {
      await logAudit({
        tenant_id: userData.tenant_id,
        user_id: req.user.id,
        action: 'STATUS_UPDATED',
        resource_type: 'quotes',
        resource_id: id,
        new_values: { status }
      });
    }

    return res.status(200).json(quote);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateQuote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const quoteData = req.body;

  try {
    // Fetch old data for audit
    const { data: oldQuote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    // Strip sensitive fields
    const { 
      quote_number, 
      tenant_id, 
      created_by, 
      id: _, 
      ...safeData 
    } = quoteData;

    const { data: quote, error } = await supabase
      .from('quotes')
      .update({ 
        ...safeData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log Audit
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', req.user.id)
      .single();

    if (userData) {
      await logAudit({
        tenant_id: userData.tenant_id,
        user_id: req.user.id,
        action: 'QUOTE_UPDATED',
        resource_type: 'quotes',
        resource_id: id,
        old_values: oldQuote,
        new_values: quote
      });
    }

    return res.status(200).json(quote);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getQuoteById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, firms(*), templates(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json(quote);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const generateQuotePdf = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, firms(*), templates(*)')
      .eq('id', id)
      .single();

    if (error || !quote) return res.status(404).json({ error: 'Quote not found' });

    // 1. Check if cached PDF exists
    if (quote.pdf_url) {
      // In a real production scenario, you might want to verify if the file still exists in storage
      // or redirect the user to the public URL.
      // For this implementation, we'll generate it if the user specifically requests it via this endpoint,
      // but we'll prioritize storage in the email service.
    }

    // 2. Generate PDF Buffer
    const pdfBuffer = await PdfService.generateQuotePdf(quote);

    // 3. Cache in Supabase Storage
    const fileName = `${quote.tenant_id}/${quote.id}_${Date.now()}.pdf`;
    const publicUrl = await uploadToSupabase('quotes', fileName, pdfBuffer, 'application/pdf');

    // 4. Update Quote with PDF URL
    await supabase
      .from('quotes')
      .update({ pdf_url: publicUrl })
      .eq('id', id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Quote-${quote.quote_number.replace(/\//g, '_')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const generatePreviewQuotePdf = async (req: AuthRequest, res: Response) => {
  const draftQuote = req.body;

  try {
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('*')
      .eq('id', draftQuote.firm_id)
      .single();
    if (firmError || !firm) return res.status(404).json({ error: 'Firm not found' });

    const { data: template } = await supabase
      .from('templates')
      .select('*')
      .eq('id', draftQuote.template_id)
      .single();

    const quoteForPdf = {
      ...draftQuote,
      quote_number: 'DRAFT',
      firms: firm,
      templates: template || null,
    };

    const pdfBuffer = await PdfService.generateQuotePdf(quoteForPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Quote-preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


export const sendQuoteEmail = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, firms(*), templates(*)')
      .eq('id', id)
      .single();

    if (error || !quote) return res.status(404).json({ error: 'Quote not found' });

    if (!quote.bill_to?.email) {
      return res.status(400).json({ error: 'Customer email is missing' });
    }

    let pdfBuffer: Buffer;

    // 1. Check if we have a cached PDF
    if (quote.pdf_url) {
      // Fetch buffer from storage (simplified for this task)
      // For now, we'll still generate it to ensure the attachment works with the mock service
      // In production, you might fetch from Supabase Storage
      pdfBuffer = await PdfService.generateQuotePdf(quote);
    } else {
      // 2. Generate and Cache
      pdfBuffer = await PdfService.generateQuotePdf(quote);
      const fileName = `${quote.tenant_id}/${quote.id}_${Date.now()}.pdf`;
      const publicUrl = await uploadToSupabase('quotes', fileName, pdfBuffer, 'application/pdf');
      
      await supabase
        .from('quotes')
        .update({ pdf_url: publicUrl })
        .eq('id', id);
    }

    // 3. Send Email with PDF
    await sendQuotationEmail(
      quote.bill_to.email,
      quote.bill_to.name,
      quote.quote_number,
      pdfBuffer
    );


    // Update Status to Sent if it was Draft
    if (quote.status.toLowerCase() === 'draft') {
      await supabase
        .from('quotes')
        .update({ status: 'Sent', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Log Audit
    await logAudit({
      tenant_id: quote.tenant_id,
      user_id: req.user.id,
      action: 'EMAIL_SENT',
      resource_type: 'quotes',
      resource_id: id,
      new_values: { sent_to: quote.bill_to.email }
    });

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
