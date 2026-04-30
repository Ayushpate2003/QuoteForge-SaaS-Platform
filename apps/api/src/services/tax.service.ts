interface TaxResult {
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

export const calculateItemTax = (
  rate: number,
  qty: number,
  cgst_rate: number,
  sgst_rate: number,
  isInterState: boolean
): TaxResult => {
  const taxable_amount = rate * qty;
  let cgst_amount = 0;
  let sgst_amount = 0;
  let igst_amount = 0;

  if (isInterState) {
    igst_amount = (taxable_amount * (cgst_rate + sgst_rate)) / 100;
  } else {
    cgst_amount = (taxable_amount * cgst_rate) / 100;
    sgst_amount = (taxable_amount * sgst_rate) / 100;
  }

  const total_amount = taxable_amount + cgst_amount + sgst_amount + igst_amount;

  return {
    taxable_amount: parseFloat(taxable_amount.toFixed(2)),
    cgst_amount: parseFloat(cgst_amount.toFixed(2)),
    sgst_amount: parseFloat(sgst_amount.toFixed(2)),
    igst_amount: parseFloat(igst_amount.toFixed(2)),
    total_amount: parseFloat(total_amount.toFixed(2)),
  };
};

export const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + num.toFixed(0)).substr(-9);
  const match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return '';

  let str = '';
  str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[Number(match[1][0])] + ' ' + a[Number(match[1][1])]) + 'Crore ' : '';
  str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[Number(match[2][0])] + ' ' + a[Number(match[2][1])]) + 'Lakh ' : '';
  str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[Number(match[3][0])] + ' ' + a[Number(match[3][1])]) + 'Thousand ' : '';
  str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[Number(match[4][0])] + ' ' + a[Number(match[4][1])]) + 'Hundred ' : '';
  str += Number(match[5]) !== 0 ? (str !== '' ? 'and ' : '') + (a[Number(match[5])] || b[Number(match[5][0])] + ' ' + a[Number(match[5][1])]) : '';

  return str ? `Indian Rupee ${str.trim()} Only` : 'Zero Rupees';
};
