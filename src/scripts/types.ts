export type TransactionType = 
    | 'House'
    | 'Communication'
    | 'Food'
    | 'Transportation'
    | 'Clothes'
    | 'Pharm'
    | 'Insurance'
    | 'Education'
    | 'Entertainment'
    | 'Pets'
    | 'Salary'
    | 'Investment'
    | 'Business'
    | 'Freelance'
    | 'Other';

export interface Transaction {
    id: string;
    name: string;
    amount: number;
    type: TransactionType;
    date: Date;
    isIncome: boolean;
}

export interface TransactionTotal {
    income: number;
    expenses: number;
    balance: number;
} 