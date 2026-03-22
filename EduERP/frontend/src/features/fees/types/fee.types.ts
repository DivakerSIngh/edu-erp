// ── Enums ─────────────────────────────────────────────────────────────────────

export type FeeStatus      = 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Waived';
export type FeeFrequency   = 'Monthly' | 'Quarterly' | 'Annual' | 'OneTime';
export type PaymentMethod  = 'Cash' | 'BankTransfer' | 'Card' | 'Cheque' | 'OnlinePortal';

// ── Fee Structures ─────────────────────────────────────────────────────────────

export interface FeeStructure {
  feeStructureId: number;
  feeName:        string;
  amount:         number;
  isRecurring:    boolean;
  frequency:      FeeFrequency | null;
  dueDate:        string | null;
  classId:        number | null;
  academicYearId: number;
  className:      string | null;
  academicYear:   string;
  createdAt:      string;
}

export interface FeeStructureCreated {
  feeStructureId: number;
}

export interface FeeStructureCreateForm {
  feeName:        string;
  academicYearId: number;
  classId:        number | null;
  amount:         number;
  isRecurring:    boolean;
  frequency:      FeeFrequency | null;
  dueDate:        string | null;
}

export interface FeeStructureUpdateForm {
  feeName:        string;
  amount:         number;
  isRecurring:    boolean;
  frequency:      FeeFrequency | null;
  dueDate:        string | null;
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export interface FeeInvoiceListItem {
  invoiceId:      number;
  invoiceNumber:  string;
  invoiceMonth:   string | null;
  dueDate:        string;
  totalAmount:    number;
  paidAmount:     number;
  balanceAmount:  number;
  status:         FeeStatus;
  feeType:        string;
  paidAt:         string | null;
  paymentMethod:  string | null;
  receiptNumber:  string | null;
}

export interface FeeInvoiceDetail extends FeeInvoiceListItem {
  studentId:        number;
  feeStructureId:   number;
  enrollmentNumber: string;
  studentName:      string;
  studentEmail:     string | null;
  className:        string;
  sectionName:      string;
}

// ── Payments ─────────────────────────────────────────────────────────────────

export interface RecordPaymentForm {
  amountPaid:           number;
  paymentMethod:        Exclude<PaymentMethod, 'OnlinePortal'>;
  transactionReference: string;
}

export interface PaymentRecorded {
  receiptNumber: string;
  invoiceStatus: string;
}

export interface CheckoutSession {
  sessionId:   string;
  checkoutUrl: string;
  expiresAt:   string;
}

// ── Reporting ─────────────────────────────────────────────────────────────────

export interface FeesSummary {
  totalCollected:  number;
  totalPending:    number;
  totalOverdue:    number;
  totalInvoices:   number;
  paidInvoices:    number;
  pendingInvoices: number;
  partialInvoices: number;
  overdueInvoices: number;
}

export interface Defaulter {
  studentId:        number;
  enrollmentNumber: string;
  studentName:      string;
  email:            string | null;
  phone:            string | null;
  className:        string;
  sectionName:      string;
  overdueCount:     number;
  totalDue:         number;
  oldestDueDate:    string;
}

export interface InvoicesGenerated {
  invoicesCreated: number;
}
