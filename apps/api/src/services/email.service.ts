import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendQuotationEmail = async (to: string, clientName: string, quoteNumber: string, pdfBuffer?: Buffer) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `QuoteForge <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: [to],
      subject: `Quotation ${quoteNumber} from QuoteForge`,
      text: `Hello ${clientName},\n\nPlease find attached the quotation ${quoteNumber}.\n\nRegards,\nQuoteForge Team`,
      attachments: pdfBuffer ? [
        {
          filename: `Quotation_${quoteNumber.replace(/\//g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ] : [],
    });

    if (error) {
      console.error('[EmailService] Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[EmailService] Unexpected error:', err);
    return { success: false, error: err.message };
  }
};
