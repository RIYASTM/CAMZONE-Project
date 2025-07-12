// Wallet JavaScript functionality
function addMoney() {
    alert('Add money functionality would be implemented here');
}

// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterDropdown = document.querySelector('.filter-dropdown');
    
    if (filterDropdown) {
        filterDropdown.addEventListener('change', function(e) {
            const filter = e.target.value;
            const rows = document.querySelectorAll('.transaction-table tbody tr');
            
            rows.forEach(row => {
                const typeElement = row.querySelector('.transaction-type');
                const statusElement = row.querySelector('.transaction-status');
                
                if (filter === 'all') {
                    row.style.display = '';
                } else if (filter === 'credit' && typeElement && typeElement.textContent.toLowerCase().includes('credit')) {
                    row.style.display = '';
                } else if (filter === 'debit' && typeElement && typeElement.textContent.toLowerCase().includes('debit')) {
                    row.style.display = '';
                } else if (filter === 'pending' && statusElement && statusElement.textContent.toLowerCase().includes('pending')) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Add hover effects and animations
    document.querySelectorAll('.balance-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});