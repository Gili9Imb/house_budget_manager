import { Expense, ExpenseType } from './types';
import { STORAGE_KEY } from './constants';

export class ExpenseManager {
    private expenses: Expense[];

    constructor() {
        this.expenses = this.loadExpenses();
    }

    private loadExpenses(): Expense[] {
        const storedExpenses = localStorage.getItem(STORAGE_KEY);
        if (!storedExpenses) return [];
        
        return JSON.parse(storedExpenses).map((expense: any) => ({
            ...expense,
            date: new Date(expense.date)
        }));
    }

    private saveExpenses(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expenses));
    }

    public addExpense(name: string, price: number, type: ExpenseType, date: Date): void {
        const expense: Expense = {
            id: crypto.randomUUID(),
            name,
            price,
            type,
            date
        };
        this.expenses.push(expense);
        this.saveExpenses();
    }

    public deleteExpense(id: string): void {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveExpenses();
    }

    public clearExpenses(filter?: (expense: Expense) => boolean): void {
        if (filter) {
            this.expenses = this.expenses.filter(expense => !filter(expense));
        } else {
            this.expenses = [];
        }
        this.saveExpenses();
    }

    public getExpenses(): Expense[] {
        return [...this.expenses].sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    public getDailyTotal(date: Date): number {
        return this.expenses
            .filter(expense => 
                expense.date.toISOString().split('T')[0] === date.toISOString().split('T')[0])
            .reduce((total, expense) => total + expense.price, 0);
    }

    public getMonthlyTotal(year: number, month: number): number {
        return this.expenses
            .filter(expense => 
                expense.date.getFullYear() === year && 
                expense.date.getMonth() === month)
            .reduce((total, expense) => total + expense.price, 0);
    }

    public getYearlyTotal(year: number): number {
        return this.expenses
            .filter(expense => expense.date.getFullYear() === year)
            .reduce((total, expense) => total + expense.price, 0);
    }
}