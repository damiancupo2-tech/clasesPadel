import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  AppState, Student, Class, Payment, Invoice, Transaction,
  User, Receipt
} from '../types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { generateRecurringClasses } from '../utils/classRecurrence';

type Action =
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'DELETE_STUDENT'; payload: string }
  | { type: 'ADD_CLASS'; payload: Class }
  | { type: 'UPDATE_CLASS'; payload: Class }
  | { type: 'DELETE_CLASS'; payload: string }
  | { type: 'UPDATE_TRANSACTION_STATUS'; payload: { id: string; status: 'Pendiente' | 'Pagado' } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_RECEIPT'; payload: Receipt }
  | { type: 'DELETE_RECEIPT'; payload: string }
  | { type: 'SET_USER'; payload: User };

const initialState: AppState = {
  students: [],
  classes: [],
  payments: [],
  invoices: [],
  transactions: [],
  receipts: [],
  currentUser: { id: 'default', name: 'Profesor', role: 'professor' }
};

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };

    case 'ADD_STUDENT':
      newState = { ...state, students: [...state.students, action.payload] };
      saveToStorage(STORAGE_KEYS.STUDENTS, newState.students);
      return newState;

    case 'UPDATE_STUDENT':
      newState = {
        ...state,
        students: state.students.map(s => s.id === action.payload.id ? action.payload : s)
      };
      saveToStorage(STORAGE_KEYS.STUDENTS, newState.students);
      return newState;

    case 'DELETE_STUDENT':
      newState = {
        ...state,
        students: state.students.filter(s => s.id !== action.payload)
      };
      saveToStorage(STORAGE_KEYS.STUDENTS, newState.students);
      return newState;

    case 'ADD_CLASS': {
      const cls = action.payload;
      let classesToAdd = [cls];

      if (cls.repeating !== 'none') {
        const recurring = generateRecurringClasses(cls).map((rec) => ({
          ...rec,
          students: [...cls.students],
          pricePerStudent: cls.pricePerStudent,
          observations: cls.observations,
          type: cls.type
        }));
        classesToAdd.push(...recurring);
      }

      const updatedClasses = [...state.classes, ...classesToAdd];

      const newTransactions = classesToAdd.flatMap(c =>
        c.students.map(studentId => ({
          id: `${c.id}_${studentId}_${Date.now()}`,
          studentId,
          studentName: state.students.find(s => s.id === studentId)?.name || '',
          classId: c.id,
          className: c.observations || '',
          type: 'charge' as const,
          amount: c.pricePerStudent,
          date: new Date(c.date),
          description: `Clase ${c.type}`,
          status: 'Pendiente' as const
        }))
      );

      newState = {
        ...state,
        classes: updatedClasses,
        transactions: [...state.transactions, ...newTransactions]
      };

      saveToStorage(STORAGE_KEYS.CLASSES, newState.classes);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      return newState;
    }

    case 'UPDATE_CLASS': {
      const updated = action.payload;

      const updatedClasses = state.classes.map(c =>
        c.id === updated.id ? updated : c
      );

      const updatedTransactions = state.transactions.filter(t => t.classId !== updated.id);

      const newTransactions = (updated.students || []).map(studentId => ({
        id: `${updated.id}_${studentId}_${Date.now()}`,
        studentId,
        studentName: state.students.find(s => s.id === studentId)?.name || '',
        classId: updated.id,
        className: updated.observations || '',
        type: 'charge' as const,
        amount: updated.pricePerStudent,
        date: new Date(updated.date),
        description: `Clase ${updated.type}`,
        status: 'Pendiente' as const
      }));

      newState = {
        ...state,
        classes: updatedClasses,
        transactions: [...updatedTransactions, ...newTransactions]
      };

      saveToStorage(STORAGE_KEYS.CLASSES, newState.classes);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      return newState;
    }

    case 'DELETE_CLASS': {
      const cid = action.payload;

      newState = {
        ...state,
        classes: state.classes.filter(c => c.id !== cid),
        transactions: state.transactions.filter(t => t.classId !== cid)
      };

      saveToStorage(STORAGE_KEYS.CLASSES, newState.classes);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      return newState;
    }

    case 'RECORD_ATTENDANCE': {
      const { studentId, classId, attendanceStatus, amount, date, className } = action.payload;

      if (attendanceStatus === 'Presente') {
        const transaction = {
          id: `${classId}_${studentId}_${Date.now()}`,
          studentId,
          studentName: state.students.find(s => s.id === studentId)?.name || '',
          classId,
          className,
          type: 'charge' as const,
          amount,
          date: new Date(date),
          description: `Clase - ${className}`,
          status: 'Pendiente' as const
        };

        newState = {
          ...state,
          transactions: [...state.transactions, transaction]
        };
      } else {
        newState = state;
      }

      const updatedStudents = state.students.map(student => {
        if (student.id === studentId) {
          const accountEntry = {
            id: `${classId}_${studentId}_${Date.now()}`,
            date: new Date(date),
            className,
            classId,
            attendanceStatus,
            amount: attendanceStatus === 'Presente' ? amount : 0,
            createdAt: new Date()
          };

          return {
            ...student,
            accountHistory: [...(student.accountHistory || []), accountEntry],
            currentBalance: student.currentBalance + (attendanceStatus === 'Presente' ? amount : 0)
          };
        }
        return student;
      });

      newState = {
        ...newState,
        students: updatedStudents
      };

      saveToStorage(STORAGE_KEYS.STUDENTS, newState.students);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      return newState;
    }

    case 'UPDATE_TRANSACTION_STATUS':
      newState = {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        )
      };
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      return newState;

    case 'ADD_TRANSACTION':
      newState = {
        ...state,
        transactions: [...state.transactions, action.payload]
      };
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newState.transactions);
      return newState;

    case 'ADD_RECEIPT':
      newState = { ...state, receipts: [...state.receipts, action.payload] };
      saveToStorage('receipts', newState.receipts);
      return newState;

    case 'DELETE_RECEIPT':
      newState = { ...state, receipts: state.receipts.filter(r => r.id !== action.payload) };
      saveToStorage('receipts', newState.receipts);
      return newState;

    case 'SET_USER':
      newState = { ...state, currentUser: action.payload };
      saveToStorage(STORAGE_KEYS.CURRENT_USER, newState.currentUser);
      return newState;

    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; }>({
  state: initialState,
  dispatch: () => {}
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const students = loadFromStorage(STORAGE_KEYS.STUDENTS) || [];
    const classes = loadFromStorage(STORAGE_KEYS.CLASSES) || [];
    const payments = loadFromStorage(STORAGE_KEYS.PAYMENTS) || [];
    const invoices = loadFromStorage(STORAGE_KEYS.INVOICES) || [];
    const transactions = (loadFromStorage(STORAGE_KEYS.TRANSACTIONS) || []).filter((t: Transaction) => t.amount !== 0);
    const receipts = loadFromStorage('receipts') || [];
    const currentUser = loadFromStorage(STORAGE_KEYS.CURRENT_USER) || initialState.currentUser;

    dispatch({
      type: 'LOAD_DATA',
      payload: { students, classes, payments, invoices, transactions, receipts, currentUser }
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
