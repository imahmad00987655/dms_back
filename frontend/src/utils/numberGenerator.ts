import apiService from '@/services/api';

interface Invoice {
  invoice_number?: string;
  [key: string]: unknown;
}

interface Payment {
  payment_number?: string;
  [key: string]: unknown;
}

interface Receipt {
  receipt_number?: string;
  [key: string]: unknown;
}

/**
 * Generate the next invoice number in format Inv_01, Inv_02, etc.
 * Checks both AP invoices and AR invoices
 * @returns Promise<string> - Next invoice number
 */
export async function generateNextInvoiceNumber(): Promise<string> {
  try {
    const matchingNumbers: number[] = [];
    
    // Fetch AP invoices (Accounts Payable)
    try {
      const apInvoices = await apiService.getAPInvoices();
      const apInvoiceNumbers = Array.isArray(apInvoices) 
        ? apInvoices 
        : (apInvoices.data || []);
      
      console.log('AP Invoices fetched for number generation:', apInvoiceNumbers.length);
      
      apInvoiceNumbers.forEach((invoice: Invoice) => {
        const invoiceNumber = invoice.invoice_number || '';
        // Match pattern: Inv_XX or INV_XX (case insensitive)
        const match = invoiceNumber.match(/^Inv_(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          matchingNumbers.push(num);
          console.log('Found matching invoice number:', invoiceNumber, '->', num);
        }
      });
    } catch (error) {
      console.warn('Error fetching AP invoices:', error);
    }
    
    // Fetch AR invoices (Accounts Receivable)
    try {
      const arInvoices = await apiService.getInvoices();
      const arInvoiceNumbers = Array.isArray(arInvoices) 
        ? arInvoices 
        : (arInvoices.data || []);
      
      console.log('AR Invoices fetched for number generation:', arInvoiceNumbers.length);
      
      arInvoiceNumbers.forEach((invoice: Invoice) => {
        const invoiceNumber = invoice.invoice_number || '';
        // Match pattern: Inv_XX or INV_XX (case insensitive)
        const match = invoiceNumber.match(/^Inv_(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          matchingNumbers.push(num);
          console.log('Found matching invoice number:', invoiceNumber, '->', num);
        }
      });
    } catch (error) {
      console.warn('Error fetching AR invoices:', error);
    }
    
    // Find the next number
    const maxNumber = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format as Inv_01, Inv_02, etc.
    const generatedNumber = `Inv_${String(nextNumber).padStart(2, '0')}`;
    console.log('Generated invoice number:', generatedNumber, '(max found:', maxNumber, ')');
    return generatedNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to Inv_01 if there's an error
    return 'Inv_01';
  }
}

/**
 * Generate the next AR invoice number in format Inv_01, Inv_02, etc.
 * Only checks AR invoices (Accounts Receivable) - separate sequence from AP invoices
 * @returns Promise<string> - Next AR invoice number
 */
export async function generateNextARInvoiceNumber(): Promise<string> {
  try {
    const matchingNumbers: number[] = [];
    
    // Fetch only AR invoices (Accounts Receivable)
    try {
      const arInvoices = await apiService.getInvoices();
      const arInvoiceNumbers = Array.isArray(arInvoices) 
        ? arInvoices 
        : (arInvoices.data || []);
      
      console.log('AR Invoices fetched for number generation:', arInvoiceNumbers.length);
      
      arInvoiceNumbers.forEach((invoice: Invoice) => {
        const invoiceNumber = invoice.invoice_number || '';
        // Match pattern: Inv_XX or INV_XX (case insensitive)
        const match = invoiceNumber.match(/^Inv_(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          matchingNumbers.push(num);
          console.log('Found matching AR invoice number:', invoiceNumber, '->', num);
        }
      });
    } catch (error) {
      console.warn('Error fetching AR invoices:', error);
    }
    
    // Find the next number
    const maxNumber = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format as Inv_01, Inv_02, etc.
    const generatedNumber = `Inv_${String(nextNumber).padStart(2, '0')}`;
    console.log('Generated AR invoice number:', generatedNumber, '(max found:', maxNumber, ')');
    return generatedNumber;
  } catch (error) {
    console.error('Error generating AR invoice number:', error);
    // Fallback to Inv_01 if there's an error
    return 'Inv_01';
  }
}

/**
 * Generate the next payment number in format Pay_01, Pay_02, etc.
 * @returns Promise<string> - Next payment number
 */
export async function generateNextPaymentNumber(): Promise<string> {
  try {
    // Fetch all payments
    const payments = await apiService.getAPPayments();
    
    // Extract numbers from payment numbers matching the pattern Pay_XX
    const paymentNumbers = Array.isArray(payments) 
      ? payments 
      : (payments.data || []);
    
    console.log('Payments fetched for number generation:', paymentNumbers.length);
    
    const matchingNumbers: number[] = [];
    
    paymentNumbers.forEach((payment: Payment) => {
      const paymentNumber = payment.payment_number || '';
      // Match pattern: Pay_XX or PAY_XX (case insensitive)
      const match = paymentNumber.match(/^Pay_(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        matchingNumbers.push(num);
        console.log('Found matching payment number:', paymentNumber, '->', num);
      }
    });
    
    // Find the next number
    const maxNumber = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format as Pay_01, Pay_02, etc.
    const generatedNumber = `Pay_${String(nextNumber).padStart(2, '0')}`;
    console.log('Generated payment number:', generatedNumber, '(max found:', maxNumber, ')');
    return generatedNumber;
  } catch (error) {
    console.error('Error generating payment number:', error);
    // Fallback to Pay_01 if there's an error
    return 'Pay_01';
  }
}

/**
 * Generate the next receipt number in format Rec_01, Rec_02, etc.
 * @returns Promise<string> - Next receipt number
 */
export async function generateNextReceiptNumber(): Promise<string> {
  try {
    // Fetch all receipts
    const receipts = await apiService.getReceipts();
    
    // Extract numbers from receipt numbers matching the pattern Rec_XX
    const receiptNumbers = Array.isArray(receipts) 
      ? receipts 
      : (receipts.data || []);
    
    console.log('Receipts fetched for number generation:', receiptNumbers.length);
    
    const matchingNumbers: number[] = [];
    
    receiptNumbers.forEach((receipt: Receipt) => {
      const receiptNumber = receipt.receipt_number || '';
      // Match pattern: Rec_XX or REC_XX (case insensitive)
      const match = receiptNumber.match(/^Rec_(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        matchingNumbers.push(num);
        console.log('Found matching receipt number:', receiptNumber, '->', num);
      }
    });
    
    // Find the next number
    const maxNumber = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format as Rec_01, Rec_02, etc.
    const generatedNumber = `Rec_${String(nextNumber).padStart(2, '0')}`;
    console.log('Generated receipt number:', generatedNumber, '(max found:', maxNumber, ')');
    return generatedNumber;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    // Fallback to Rec_01 if there's an error
    return 'Rec_01';
  }
}

