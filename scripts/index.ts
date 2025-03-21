import { ExpenseManager } from './ExpenseManager';
import { UIManager } from './UIManager';
import '../styles/main.css';
import '../styles/buttons.css';
import '../styles/modal.css';
import '../styles/responsive.css';

document.addEventListener('DOMContentLoaded', () => {
    const expenseManager = new ExpenseManager();
    new UIManager(expenseManager);
}); 