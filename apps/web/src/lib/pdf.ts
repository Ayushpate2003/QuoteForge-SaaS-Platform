import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const fallbackToPrint = (element: HTMLElement, fileName: string) => {
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please allow popups.');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { margin: 0; padding: 16px; background: #fff; }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const generatePDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (error: any) {
    const message = String(error?.message || '');
    if (message.includes('unsupported color function')) {
      console.warn('Unsupported CSS color for html2canvas. Falling back to print mode.');
      fallbackToPrint(element, fileName);
      return;
    }
    console.error('Error generating PDF:', error);
    throw error;
  }
};
