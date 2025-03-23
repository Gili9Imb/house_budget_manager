import { Transaction, TransactionType, TransactionTotal } from './types';

export class TransactionManager {
    private transactions: Transaction[] = [];
    private readonly STORAGE_KEY = 'transactions';

    constructor() {
        this.loadTransactions();
    }

    private loadTransactions(): void {
        const storedTransactions = localStorage.getItem(this.STORAGE_KEY);
        if (storedTransactions) {
            const parsedTransactions = JSON.parse(storedTransactions);
            this.transactions = parsedTransactions.map((t: any) => ({
                ...t,
                date: new Date(t.date),
                isIncome: t.isIncome || false
            }));
        }
    }

    private saveTransactions(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.transactions));
    }

    public addTransaction(name: string, amount: number, type: TransactionType, date: Date, isIncome: boolean): void {
        const transaction: Transaction = {
            id: Date.now().toString(),
            name,
            amount,
            type,
            date,
            isIncome
        };

        this.transactions.push(transaction);
        this.saveTransactions();
    }

    public deleteTransaction(id: string): void {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
    }

    public clearTransactions(filter?: (transaction: Transaction) => boolean): void {
        if (filter) {
            this.transactions = this.transactions.filter(t => !filter(t));
        } else {
            this.transactions = [];
        }
        this.saveTransactions();
    }

    public getTransactions(): Transaction[] {
        return [...this.transactions];
    }

    public getDailyTotal(date: Date): TransactionTotal {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const dailyTransactions = this.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            transactionDate.setHours(0, 0, 0, 0);
            return transactionDate.getTime() === normalizedDate.getTime();
        });

        return this.calculateTotal(dailyTransactions);
    }

    public getMonthlyTotal(year: number, month: number): TransactionTotal {
        const monthlyTransactions = this.transactions.filter(transaction => 
            transaction.date.getFullYear() === year && 
            transaction.date.getMonth() === month
        );

        return this.calculateTotal(monthlyTransactions);
    }

    public getYearlyTotal(year: number): TransactionTotal {
        const yearlyTransactions = this.transactions.filter(transaction => 
            transaction.date.getFullYear() === year
        );

        return this.calculateTotal(yearlyTransactions);
    }

    private calculateTotal(transactions: Transaction[]): TransactionTotal {
        const income = transactions
            .filter(t => t.isIncome)
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => !t.isIncome)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expenses: Math.abs(expenses),
            balance: income + expenses
        };
    }
} 