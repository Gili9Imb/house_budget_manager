import { Expense, ExpenseType } from './types';
import { MONTHS, YEARS } from './constants';
import { ExpenseManager } from './ExpenseManager';

export class UIManager {
    private expenseManager: ExpenseManager;
    private currentView: 'daily' | 'monthly' | 'yearly' = 'daily';

    constructor(expenseManager: ExpenseManager) {
        this.expenseManager = expenseManager;
        this.initializeUI();
        this.setupEventListeners();
        this.updateExpenses();
    }

    private initializeUI(): void {
        this.initializeMonthContents();
        this.initializeYearContents();
        this.setDefaultDate();
        this.setCurrentMonthAndYear();
    }

    private setDefaultDate(): void {
        const dateInput = document.getElementById('expense-date') as HTMLInputElement;
        dateInput.valueAsDate = new Date();
    }

    private setCurrentMonthAndYear(): void {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        this.setActiveMonthTab(currentMonth);
        this.setActiveYearTab(currentYear);
    }

    private setupEventListeners(): void {
        this.setupTabListeners();
        this.setupFormListener();
        this.setupClearExpensesListener();
        this.setupModalListeners();
        this.setupDateChangeListener();
    }

    private setupTabListeners(): void {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });

        document.querySelectorAll('.month-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleMonthTabClick(e));
        });

        document.querySelectorAll('.year-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleYearTabClick(e));
        });
    }

    private setupFormListener(): void {
        const form = document.getElementById('expense-form') as HTMLFormElement;
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    private setupClearExpensesListener(): void {
        const clearButton = document.getElementById('clear-expenses');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.showClearModal());
        }
    }

    private setupModalListeners(): void {
        // Clear modal listeners
        document.getElementById('confirm-clear')?.addEventListener('click', () => {
            this.handleClearExpenses();
            this.hideClearModal();
        });

        document.getElementById('cancel-clear')?.addEventListener('click', () => {
            this.hideClearModal();
        });

        // Delete modal listeners
        document.getElementById('confirm-delete')?.addEventListener('click', () => {
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal && deleteModal.dataset.expenseId) {
                this.handleDeleteExpense(deleteModal.dataset.expenseId);
                this.hideDeleteModal();
            }
        });

        document.getElementById('cancel-delete')?.addEventListener('click', () => {
            this.hideDeleteModal();
        });
    }

    private setupDateChangeListener(): void {
        const dateInput = document.getElementById('expense-date');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.updateExpenses());
        }
    }

    private handleTabClick(e: Event): void {
        const tab = e.target as HTMLElement;
        const period = tab.dataset.period as 'daily' | 'monthly' | 'yearly';
        
        this.currentView = period;
        this.updateActiveTab(tab);
        this.updateActiveContent(period);
    }

    private handleMonthTabClick(e: Event): void {
        const tab = e.target as HTMLElement;
        const month = tab.dataset.month;
        if (month) {
            this.setActiveMonthTab(parseInt(month));
        }
    }

    private handleYearTabClick(e: Event): void {
        const tab = e.target as HTMLElement;
        const year = tab.dataset.year;
        if (year) {
            this.setActiveYearTab(parseInt(year));
        }
    }

    private handleFormSubmit(e: Event): void {
        e.preventDefault();
        
        const nameInput = document.getElementById('expense-name') as HTMLInputElement;
        const priceInput = document.getElementById('expense-price') as HTMLInputElement;
        const dateInput = document.getElementById('expense-date') as HTMLInputElement;
        const typeInput = document.getElementById('expense-type') as HTMLSelectElement;

        const name = nameInput.value;
        const price = parseFloat(priceInput.value);
        const type = typeInput.value as ExpenseType;
        const date = new Date(dateInput.value);

        if (name && !isNaN(price) && price > 0) {
            this.expenseManager.addExpense(name, price, type, date);
            this.updateExpenses();
            (e.target as HTMLFormElement).reset();
            dateInput.valueAsDate = new Date();
        }
    }

    private handleDeleteExpense(id: string): void {
        this.expenseManager.deleteExpense(id);
        this.updateExpenses();
    }

    private handleClearExpenses(): void {
        const activeTab = document.querySelector('.tab.active');
        if (!activeTab) return;

        const period = activeTab.getAttribute('data-period');
        let filter: ((expense: Expense) => boolean) | undefined;

        switch (period) {
            case 'monthly': {
                const activeMonth = document.querySelector('.month-tab.active');
                if (activeMonth) {
                    const month = parseInt(activeMonth.getAttribute('data-month') || '0');
                    const currentYear = new Date().getFullYear();
                    filter = (expense: Expense) => 
                        expense.date.getMonth() === month && 
                        expense.date.getFullYear() === currentYear;
                }
                break;
            }
            case 'yearly': {
                const activeYear = document.querySelector('.year-tab.active');
                if (activeYear) {
                    const year = parseInt(activeYear.getAttribute('data-year') || '0');
                    filter = (expense: Expense) => expense.date.getFullYear() === year;
                }
                break;
            }
        }

        this.expenseManager.clearExpenses(filter);
        this.updateExpenses();
    }

    private updateExpenses(): void {
        this.updateDailyView();
        this.updateMonthlyView();
        this.updateYearlyView();
    }

    private updateDailyView(): void {
        const dailyList = document.getElementById('daily-expense-list');
        if (!dailyList) return;

        dailyList.innerHTML = '';
        const expenses = this.expenseManager.getExpenses();
        
        expenses.forEach(expense => {
            const li = this.createExpenseElement(expense, 'daily');
            dailyList.appendChild(li);
        });

        const dailyTotal = document.getElementById('daily-total');
        if (dailyTotal) {
            dailyTotal.textContent = this.expenseManager.getDailyTotal(new Date()).toFixed(2);
        }
    }

    private updateMonthlyView(): void {
        const currentYear = new Date().getFullYear();
        MONTHS.forEach((_, index) => {
            const monthList = document.getElementById(`month-${index}-expense-list`);
            const monthTotal = document.getElementById(`month-${index}-total`);
            
            if (monthList && monthTotal) {
                monthList.innerHTML = '';
                const total = this.expenseManager.getMonthlyTotal(currentYear, index);
                monthTotal.textContent = total.toFixed(2);

                const expenses = this.expenseManager.getExpenses()
                    .filter(expense => 
                        expense.date.getMonth() === index && 
                        expense.date.getFullYear() === currentYear);

                expenses.forEach(expense => {
                    const li = this.createExpenseElement(expense, 'monthly');
                    monthList.appendChild(li);
                });
            }
        });
    }

    private updateYearlyView(): void {
        YEARS.forEach(year => {
            const yearList = document.getElementById(`year-${year}-expense-list`);
            const yearTotal = document.getElementById(`year-${year}-total`);
            
            if (yearList && yearTotal) {
                yearList.innerHTML = '';
                const total = this.expenseManager.getYearlyTotal(year);
                yearTotal.textContent = total.toFixed(2);

                const expenses = this.expenseManager.getExpenses()
                    .filter(expense => expense.date.getFullYear() === year);

                expenses.forEach(expense => {
                    const li = this.createExpenseElement(expense, 'yearly');
                    yearList.appendChild(li);
                });
            }
        });
    }

    private createExpenseElement(expense: Expense, view: 'daily' | 'monthly' | 'yearly'): HTMLLIElement {
        const li = document.createElement('li');
        li.dataset.expenseId = expense.id;
        li.textContent = `${expense.name} - ${expense.price} ₪ (${expense.type}) - ${expense.date.toLocaleDateString()}`;
        
        if (view === 'daily') {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => this.showDeleteModal(expense.id);
            li.appendChild(deleteBtn);
        }
        
        return li;
    }

    private initializeMonthContents(): void {
        const monthlyContents = document.getElementById('monthly-contents');
        if (!monthlyContents) return;

        monthlyContents.innerHTML = MONTHS.map((month, i) => `
            <div class="month-content${i === 0 ? ' active' : ''}" id="month-${i}-content">
                <div class="summary">
                    <h3>${month} Summary</h3>
                    <p>Total: <span id="month-${i}-total">0</span> ₪</p>
                </div>
                <ul id="month-${i}-expense-list"></ul>
            </div>
        `).join('');
    }

    private initializeYearContents(): void {
        const yearlyContents = document.getElementById('yearly-contents');
        if (!yearlyContents) return;

        yearlyContents.innerHTML = YEARS.map((year, i) => `
            <div class="year-content${i === 0 ? ' active' : ''}" id="year-${year}-content">
                <div class="summary">
                    <h3>${year} Summary</h3>
                    <p>Total: <span id="year-${year}-total">0</span> ₪</p>
                </div>
                <ul id="year-${year}-expense-list"></ul>
            </div>
        `).join('');
    }

    private showDeleteModal(expenseId: string): void {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.style.display = 'block';
            modal.dataset.expenseId = expenseId;
        }
    }

    private hideDeleteModal(): void {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.expenseId;
        }
    }

    private showClearModal(): void {
        const modal = document.getElementById('clear-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    private hideClearModal(): void {
        const modal = document.getElementById('clear-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    private updateActiveTab(activeTab: HTMLElement): void {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');
    }

    private updateActiveContent(period: string): void {
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${period}-content`) {
                content.classList.add('active');
            }
        });
    }

    private setActiveMonthTab(month: number): void {
        document.querySelectorAll('.month-tab').forEach(tab => {
            tab.classList.remove('active');
            if (parseInt(tab.getAttribute('data-month') || '0') === month) {
                tab.classList.add('active');
            }
        });

        document.querySelectorAll('.month-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === `month-${month}-content`) {
                content.classList.add('active');
            }
        });
    }

    private setActiveYearTab(year: number): void {
        document.querySelectorAll('.year-tab').forEach(tab => {
            tab.classList.remove('active');
            if (parseInt(tab.getAttribute('data-year') || '0') === year) {
                tab.classList.add('active');
            }
        });

        document.querySelectorAll('.year-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === `year-${year}-content`) {
                content.classList.add('active');
            }
        });
    }
} 