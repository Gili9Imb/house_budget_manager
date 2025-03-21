export interface Expense {
    id: string;
    name: string;
    price: number;
    type: ExpenseType;
    date: Date;
}

export type ExpenseType = 
    | 'House'
    | 'Communication'
    | 'Food'
    | 'Transportation'
    | 'Clothes'
    | 'Pharm'
    | 'Insurance'
    | 'Education'
    | 'Entertainment'
    | 'Other';

export interface ExpenseTotal {
    [key: string]: number | number[];
}

export interface ViewType {
    daily: string;
    monthly: string;
    yearly: string;
} 