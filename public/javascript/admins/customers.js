const search = document.getElementById('search')
const searchValue = search.value

document.getElementById('search').addEventListener('keypress', function (e) {
    const searchValue = search.value

    if (e.key === 'Enter') {
        window.location.href = `?search=${searchValue}`
    }
})

if (searchValue) {
    document.getElementById('clear-button').addEventListener('click', function (e) {
        window.location.href = `/admin/customers`
    })
}

const blockCustomerModal = document.getElementById('blockCustomerModal')

document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.blockCustomer').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault()
            const btn = e.currentTarget
            const id = btn.dataset.id
            const name = btn.dataset.name
            const page = btn.dataset.page
            const isBlocked = btn.dataset.blocked
            showBlockCustomerModal(id, name, page, btn, isBlocked)
        })
    })

    document.getElementById('cancelBlockButton').addEventListener('click', hideBlockCustomerModal)

    const searchBar = document.getElementById('search')
    const sortBy = document.querySelector('.sort-by');
    const filter = document.querySelector('.filter');
    const clearButton = document.getElementById('clear-button');

    let currentState = {
        search: '',
        sort: 'all',
        filter: 'all',
        page: 1
    };

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // Fetch customers
    async function fetchCustomers({ search, sort, filter, page }) {
        try {
            let queryParts = [];
            if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
            if (sort) queryParts.push(`sort=${sort}`);
            if (filter) queryParts.push(`filter=${filter}`);
            if (page) queryParts.push(`page=${page}`);

            const finalQuery = queryParts.join('&');

            const response = await fetch(`/admin/customers?${finalQuery}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                updateCustomerTable(result.datas, parseInt(result.currentPages));
                updatePagination(parseInt(result.currentPages), parseInt(result.totalPages));
            } else {
                console.error('Failed to fetch customers:', result.message);
                return showNotification('Something went wrong. Try again later', 'error');
            }
        } catch (error) {
            console.error('Something went wrong:', error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    }

    // Update table
    function updateCustomerTable(datas, currentPages) {
        const tbody = document.querySelector('.customers-table tbody');
        tbody.innerHTML = '';
        if (!datas || datas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No customers found</td></tr>';
            return;
        }
        datas.forEach(data => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${data.name}</td>
            <td>${data.email}</td>
            <td>${data.phone}</td>
            <td>${new Date(data.createdOn).toDateString().split(' ').slice(1, 4).join(' ')}</td>
            <td>
                <a class="blockCustomer"
                        data-id="${data._id}" 
                        data-name="${data.name}" 
                        data-page="${currentPages}" 
                        data-blocked="${data.isBlocked}">
                        ${data.isBlocked ? 'Unblock' : 'Block'}
                </a>
            </td>
        `;
            tbody.appendChild(tr);
        });
    }

    // Event listeners for search, sort, filter
    searchBar.addEventListener('input', debounce(() => {
        currentState.search = searchBar.value.trim();
        currentState.page = 1;
        fetchCustomers({ ...currentState });
    }, 300));

    sortBy.addEventListener('change', () => {
        currentState.sort = sortBy.value;
        currentState.page = 1;
        fetchCustomers({ ...currentState });
    });

    filter.addEventListener('change', () => {
        currentState.filter = filter.value;
        currentState.page = 1;
        fetchCustomers({ ...currentState });
    });

    // Clear button
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            currentState.search = '';
            currentState.page = 1;
            fetchCustomers({ ...currentState });
        });
    }

    // Pagination buttons
    document.querySelectorAll('.pagination-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (!isNaN(page) && page >= 1) {
                currentState.page = page;
                fetchCustomers({ ...currentState });
            }
        });
    });

    function updatePagination(currentPages, totalPages) {
        const paginationDiv = document.querySelector('.pagination');
        paginationDiv.innerHTML = `
            <span>${currentPages} of ${totalPages}</span>
            <div class="pagination-controls">
                <button class="pagination-button" data-page="1" ${currentPages === 1 ? 'disabled' : ''}><i class="fas fa-angle-double-left"></i></button>
                <button class="pagination-button" data-page="${currentPages - 1}" ${currentPages === 1 ? 'disabled' : ''}><i class="fas fa-angle-left"></i></button>
                <span> - </span>
                <button class="pagination-button" data-page="${currentPages + 1}" ${currentPages === totalPages ? 'disabled' : ''}><i class="fas fa-angle-right"></i></button>
                <button class="pagination-button" data-page="${totalPages}" ${currentPages === totalPages ? 'disabled' : ''}><i class="fas fa-angle-double-right"></i></button>
            </div>
        `;

        // Attach event listeners again after updating buttons
        paginationDiv.querySelectorAll('.pagination-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page) && page >= 1) {
                    currentState.page = page;
                    fetchCustomers({ ...currentState });
                }
            });
        });
    }

    async function blockCustomer(id, page, btn) {
        try {
            console.log('clicked : ', id)
            const response = await fetch('/admin/blockCustomer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ id, currentPages: page })
            })

            const data = await response.json()
            console.log(data);

            if (response.ok && data.success) {
                if (data.done === 'Blocked') {
                    btn.textContent = 'Unblock'
                    btn.dataset.blocked = 'true';
                    showNotification(data.message || 'Customer is Blocked', 'success')
                } else if (data.done === 'Unblocked') {
                    btn.textContent = 'Block'
                    btn.dataset.blocked = 'false';
                    showNotification(data.message || 'Customer is UnBlocked', 'success')
                }
                blockCustomerModal.style.display = 'none'
            } else {
                showNotification(data.message || 'Customer modification failed!!', 'error')
            }
        } catch (error) {
            console.log('Customer updation failed : ', error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    }
    function hideBlockCustomerModal() {
        blockCustomerModal.style.display = 'none'
    }

    function showBlockCustomerModal(id, name, page, btn, isBlocked) {

        blockCustomerModal.style.display = 'block'

        const blockCustomerMessage = document.getElementById('blockCustomerMessage')
        const confirmButton = document.getElementById('confirmBlockButton')
        console.log('isBlocked : ', isBlocked)

        if (isBlocked === true || isBlocked === 'true') {
            blockCustomerMessage.textContent = `Are you sure to unblock ${name}?`
            confirmButton.textContent = 'Unblock'
        } else {
            blockCustomerMessage.textContent = `Are you sure to block ${name}?`
            confirmButton.textContent = 'Block'
        }
        confirmButton.onclick = () => blockCustomer(id, page, btn);

    }

    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 15px 20px;
                        border-radius: 5px;
                        color: white;
                        font-weight: 500;
                        z-index: 1000;
                        animation: slideIn 0.3s ease;
                        ${type === 'success' ? 'background-color: #4CAF50;' : 'background-color: #f44336;'}
                    `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
                        @keyframes slideIn {
                            from {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }
                        @keyframes slideOut {
                            from {
                                transform: translateX(0);
                                opacity: 1;
                            }
                            to {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                        }
                    `;

        if (!document.querySelector('style[data-notification]')) {
            style.setAttribute('data-notification', 'true');
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
})









