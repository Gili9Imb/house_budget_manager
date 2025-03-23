import { Transaction, TransactionType, TransactionTotal } from './types';
import { MONTHS, YEARS } from './constants';
import { TransactionManager } from './TransactionManager';

export class UIManager {
    private transactionManager: TransactionManager;
    private currentView: 'daily' | 'monthly' | 'yearly' = 'daily';

    constructor(transactionManager: TransactionManager) {
        this.transactionManager = transactionManager;
        this.initializeUI();
        this.setupEventListeners();
        this.updateTransactions();
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
        document.getElementById('confirm-clear')?.addEventListener('click', () => {
            this.handleClearExpenses();
            this.hideClearModal();
        });

        document.getElementById('cancel-clear')?.addEventListener('click', () => {
            this.hideClearModal();
        });

        document.getElementById('confirm-delete')?.addEventListener('click', () => {
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal && deleteModal.dataset.transactionId) {
                this.handleDeleteTransaction(deleteModal.dataset.transactionId);
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
            dateInput.addEventListener('change', () => this.updateTransactions());
        }
    }

    private handleFormSubmit(e: Event): void {
        e.preventDefault();
        
        const nameInput = document.getElementById('expense-name') as HTMLInputElement;
        const priceInput = document.getElementById('expense-price') as HTMLInputElement;
        const dateInput = document.getElementById('expense-date') as HTMLInputElement;
        const typeInput = document.getElementById('expense-type') as HTMLSelectElement;
        const transactionTypeInput = document.getElementById('transaction-type') as HTMLSelectElement;

        const name = nameInput.value;
        const price = parseFloat(priceInput.value);
        const type = typeInput.value as TransactionType;
        const date = new Date(dateInput.value);
        const isIncome = transactionTypeInput.value === 'income';

        if (name && !isNaN(price) && price > 0) {
            // Make price positive for income, negative for expense
            const finalPrice = isIncome ? price : -price;
            this.transactionManager.addTransaction(name, finalPrice, type, date, isIncome);
            this.updateTransactions();
            (e.target as HTMLFormElement).reset();
            dateInput.valueAsDate = new Date();
        }
    }

    private handleDeleteTransaction(id: string): void {
        this.transactionManager.deleteTransaction(id);
        this.updateTransactions();
    }

    private handleClearExpenses(): void {
        const activeTab = document.querySelector('.tab.active');
        if (!activeTab) return;

        const period = activeTab.getAttribute('data-period');
        let filter: ((transaction: Transaction) => boolean) | undefined;

        switch (period) {
            case 'monthly': {
                const activeMonth = document.querySelector('.month-tab.active');
                if (activeMonth) {
                    const month = parseInt(activeMonth.getAttribute('data-month') || '0');
                    const currentYear = new Date().getFullYear();
                    filter = (transaction: Transaction) => 
                        transaction.date.getMonth() === month && 
                        transaction.date.getFullYear() === currentYear;
                }
                break;
            }
            case 'yearly': {
                const activeYear = document.querySelector('.year-tab.active');
                if (activeYear) {
                    const year = parseInt(activeYear.getAttribute('data-year') || '0');
                    filter = (transaction: Transaction) => transaction.date.getFullYear() === year;
                }
                break;
            }
        }

        this.transactionManager.clearTransactions(filter);
        this.updateTransactions();
    }

    private updateTransactions(): void {
        this.updateDailyView();
        this.updateMonthlyView();
        this.updateYearlyView();
    }

    private updateDailyView(): void {
        const dailyList = document.getElementById('daily-expense-list');
        const dailyIncome = document.getElementById('daily-income');
        const dailyExpenses = document.getElementById('daily-expenses');
        const dailyBalance = document.getElementById('daily-balance');

        if (!dailyList) return;

        dailyList.innerHTML = '';
        const transactions = this.transactionManager.getTransactions();
        const today = new Date();
        
        const dailyTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.toDateString() === today.toDateString();
        });
        
        dailyTransactions.forEach(transaction => {
            const li = this.createTransactionElement(transaction, 'daily');
            dailyList.appendChild(li);
        });

        if (dailyIncome && dailyExpenses && dailyBalance) {
            const dailyTotal = this.transactionManager.getDailyTotal(today);
            dailyIncome.textContent = dailyTotal.income.toFixed(2);
            dailyExpenses.textContent = `-${dailyTotal.expenses.toFixed(2)}`;
            dailyBalance.textContent = dailyTotal.balance.toFixed(2);
            dailyBalance.className = dailyTotal.balance >= 0 ? 'income' : 'expense';
        }
    }

    private updateMonthlyView(): void {
        const currentYear = new Date().getFullYear();
        MONTHS.forEach((_, index) => {
            const monthList = document.getElementById(`month-${index}-expense-list`);
            const monthIncome = document.getElementById(`month-${index}-income`);
            const monthExpenses = document.getElementById(`month-${index}-expenses`);
            const monthBalance = document.getElementById(`month-${index}-balance`);
            
            if (monthList) {
                monthList.innerHTML = '';
                const transactions = this.transactionManager.getTransactions()
                    .filter(transaction => 
                        transaction.date.getMonth() === index && 
                        transaction.date.getFullYear() === currentYear);

                transactions.forEach(transaction => {
                    const li = this.createTransactionElement(transaction, 'monthly');
                    monthList.appendChild(li);
                });
            }

            if (monthIncome && monthExpenses && monthBalance) {
                const monthlyTotal = this.transactionManager.getMonthlyTotal(currentYear, index);
                monthIncome.textContent = monthlyTotal.income.toFixed(2);
                monthExpenses.textContent = `-${monthlyTotal.expenses.toFixed(2)}`;
                monthBalance.textContent = monthlyTotal.balance.toFixed(2);
                monthBalance.className = monthlyTotal.balance >= 0 ? 'income' : 'expense';
            }
        });
    }

    private updateYearlyView(): void {
        YEARS.forEach(year => {
            const yearList = document.getElementById(`year-${year}-expense-list`);
            const yearIncome = document.getElementById(`year-${year}-income`);
            const yearExpenses = document.getElementById(`year-${year}-expenses`);
            const yearBalance = document.getElementById(`year-${year}-balance`);
            
            if (yearList) {
                yearList.innerHTML = '';
                const transactions = this.transactionManager.getTransactions()
                    .filter(transaction => transaction.date.getFullYear() === year);

                transactions.forEach(transaction => {
                    const li = this.createTransactionElement(transaction, 'yearly');
                    yearList.appendChild(li);
                });
            }

            if (yearIncome && yearExpenses && yearBalance) {
                const yearlyTotal = this.transactionManager.getYearlyTotal(year);
                yearIncome.textContent = yearlyTotal.income.toFixed(2);
                yearExpenses.textContent = `-${yearlyTotal.expenses.toFixed(2)}`;
                yearBalance.textContent = yearlyTotal.balance.toFixed(2);
                yearBalance.className = yearlyTotal.balance >= 0 ? 'income' : 'expense';
            }
        });
    }

    private createTransactionElement(transaction: Transaction, view: 'daily' | 'monthly' | 'yearly'): HTMLLIElement {
        const li = document.createElement('li');
        li.dataset.transactionId = transaction.id;
        li.className = transaction.isIncome ? 'income' : 'expense';
        
        const sign = transaction.isIncome ? '+' : '';
        const formattedDate = transaction.date.toLocaleDateString('en-GB');
        li.textContent = `${formattedDate} ${transaction.name} (${transaction.type}): ${sign}${transaction.amount} ₪`;
        
        if (view === 'daily') {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => this.showDeleteModal(transaction.id);
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
                    <div class="summary-grid">
                        <div class="summary-item income">
                            <span class="label">Income:</span>
                            <span id="month-${i}-income">0</span> ₪
                        </div>
                        <div class="summary-item expense">
                            <span class="label">Expenses:</span>
                            <span id="month-${i}-expenses">0</span> ₪
                        </div>
                        <div class="summary-item">
                            <span class="label">Balance:</span>
                            <span id="month-${i}-balance">0</span> ₪
                        </div>
                    </div>
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
                    <div class="summary-grid">
                        <div class="summary-item income">
                            <span class="label">Income:</span>
                            <span id="year-${year}-income">0</span> ₪
                        </div>
                        <div class="summary-item expense">
                            <span class="label">Expenses:</span>
                            <span id="year-${year}-expenses">0</span> ₪
                        </div>
                        <div class="summary-item">
                            <span class="label">Balance:</span>
                            <span id="year-${year}-balance">0</span> ₪
                        </div>
                    </div>
                </div>
                <ul id="year-${year}-expense-list"></ul>
            </div>
        `).join('');
    }

    private showDeleteModal(transactionId: string): void {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.style.display = 'block';
            modal.dataset.transactionId = transactionId;
        }
    }

    private hideDeleteModal(): void {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.transactionId;
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
