import { TransactionManager } from '../src/scripts/TransactionManager';
import { UIManager } from '../src/scripts/UIManager';
import '../styles/main.css';
import '../styles/buttons.css';
import '../styles/modal.css';
import '../styles/responsive.css';

document.addEventListener('DOMContentLoaded', () => {
    const transactionManager = new TransactionManager();
    new UIManager(transactionManager);
}); 