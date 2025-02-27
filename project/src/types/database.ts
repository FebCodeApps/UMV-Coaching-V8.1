export type Board = 'CBSE' | 'ASSEB';
export type ClassLevel = '9' | '10' | '11' | '12';
export type FeeCycleType = 'biweekly' | 'triweekly' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'cash' | 'upi' | 'net_banking';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  feeCycle: FeeCycleType;
  feeAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  board: Board;
  classLevel: ClassLevel;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeeCycle {
  id: string;
  cycleType: FeeCycleType;
  amount: number;
  earlyPaymentDiscount: number;
  latePaymentPenalty: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  feeCycleId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  dueDate: string;
  paymentDate: string | null;
  classesTaken: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  date: string;
  status: boolean;
  notes: string | null;
  classTaken: boolean;
  classNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
