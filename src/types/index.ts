export interface Student {
  id: string;
  name: string;
  dni: string;
  phone: string;
  lot: string;
  neighborhood: string;
  condition: 'Titular' | 'Familiar';
  observations: string;
  currentBalance: number;
  createdAt: Date;
  accountHistory: AccountEntry[];
}

export interface AccountEntry {
  id: string;
  date: Date;
  className: string;
  classId: string;
  attendanceStatus: 'Presente' | 'Ausente';
  amount: number;
  createdAt: Date;
}

export interface Class {
  id: string;
  date: Date;
  type: 'individual' | 'group';
  maxStudents: number;
  pricePerStudent: number;
  observations: string;
  repeating: 'none' | 'weekly' | 'monthly';
  students: string[];
  attendances: { [studentId: string]: boolean };
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  parentId?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: 'cash' | 'transfer' | 'card' | 'combined';
  date: Date;
  description: string;
  invoiceId?: string;
  transactionIds: string[];
}

export interface Invoice {
  id: string;
  studentId: string;
  number: string;
  date: Date;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'combined';
  paidAt?: Date;
}

export interface InvoiceItem {
  id: string;
  transactionId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className: string;
  type: 'charge' | 'payment';
  amount: number;
  date: Date;
  description: string;
  status: 'Pendiente' | 'Pagado';
  invoiceId?: string;
}

// ✅ NUEVO: Recibo generado al cobrar múltiples transacciones
export interface Receipt {
  id: string;
  studentId: string;
  studentName: string;
  date: Date;
  transactions: {
    id: string;
    className: string;
    date: Date;
    amount: number;
  }[];
  totalAmount: number;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'professor';
}

export interface AppState {
  students: Student[];
  classes: Class[];
  payments: Payment[];
  invoices: Invoice[];
  transactions: Transaction[];
  receipts: Receipt[]; // ✅ NUEVO: historial de recibos
  currentUser: User;
}
