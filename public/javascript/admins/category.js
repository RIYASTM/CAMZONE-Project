document.addEventListener('DOMContentLoaded', () => {
    // Search Management
    const search = document.getElementById('search');
    if (search) {
        search.addEventListener('keypress', (e) => {
            const searchValue = search.value.trim();
            if (e.key === 'Enter' && searchValue) {
                window.location.href = `?search=${encodeURIComponent(searchValue)}`;
            }
        });

        const clearButton = document.getElementById('clear-button');
        if (clearButton && search.value.trim()) {
            clearButton.addEventListener('click', () => {
                window.location.href = '/admin/category';
            });
        }
    }

    // Image Preview for Add Category
    const addCategoryImage = document.getElementById('addCategoryImage');
    if (addCategoryImage) {
        addCategoryImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('addImagePreview');
            preview.innerHTML = '';
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('File size exceeds 5MB limit!', 'error');
                    e.target.value = '';
                    return;
                }
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.objectFit = 'fill';
                preview.appendChild(img);
            }
        });
    }

    // Image Preview for Edit Category
    const editCategoryImage = document.getElementById('editCategoryImage');
    if (editCategoryImage) {
        editCategoryImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('currentImage');
            preview.innerHTML = '';
            if (file) {
                if (file.size > 5 * 1024 * 1024) {

                    showNotification('File size exceeds 5MB limit!', 'error');
                    e.target.value = '';
                    return;
                }
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.objectFit = 'fill';
                preview.appendChild(img);
            }
        });
    }

    // Add Category Modal
    const categoryForm = document.getElementById('categoryForm');
    const addCategoryButton = document.getElementById('addCategoryButton');
    const addCategoryModal = document.getElementById('addCategoryModal');
    const cancelButton = document.getElementById('cancelButton');
    const modalOverlay = addCategoryModal?.querySelector('.modal-overlay');

    if (addCategoryButton && addCategoryModal) {
        addCategoryButton.addEventListener('click', showAddCategoryModal);
        if (cancelButton) {
            cancelButton.addEventListener('click', hideAddCategoryModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', hideAddCategoryModal);
        }
    }

    // Edit Category Modal
    const editCategoryModal = document.getElementById('editCategoryModal');
    const editCategoryForm = document.getElementById('EditCategoryForm');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const editModalOverlay = editCategoryModal?.querySelector('.modal-overlay');

    document.querySelectorAll('.editCategory').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault()

            const categoryId = button.dataset.id
            const categoryname = button.dataset.name
            const description = button.dataset.description
            const categoryOffer = button.dataset.offer || 0
            const isListed = button.dataset.listed === ('true' || 'True');
            const image = button.dataset.image
            const test = button.dataset.riyas

            showEditCategoryModal(categoryId, categoryname, description, categoryOffer, isListed, image)

        })
    })

    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await SaveChanges(event);
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', hideEditCategoryModal);
    }

    if (editModalOverlay) {
        editModalOverlay.addEventListener('click', hideEditCategoryModal);
    }

    // Add Category Form Submission
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors(categoryForm);

            const formData = new FormData(categoryForm);
            formData.set('listCategory', document.getElementById('addCheckbox').checked);

            const errors = validateForm({
                categoryName: formData.get('categoryName'),
                categoryDescription: formData.get('categoryDescription'),
                offerPrice: formData.get('offerPrice'),
            });

            if (errors) {
                displayFormError(categoryForm, errors);
                return;
            }

            try {
                const response = await fetch('/admin/addCategory', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (!data.success) {
                    showNotification(data.message || 'Validation error', 'error');
                    if (data.errors) {
                        displayFormError(categoryForm, data.errors);
                    }
                } else {
                    showNotification(data.message || 'Category Added Successfully', 'success')
                    window.location.replace(data.redirectUrl);
                }
            } catch (error) {
                console.error('Category adding error:', error);
                return showNotification('Something went wrong. Try again later', 'error');
            }
        });
    }

    function showAddCategoryModal() {
        if (addCategoryModal) {
            addCategoryModal.style.display = 'block';
        }
    }

    function hideAddCategoryModal() {
        if (addCategoryModal) {
            addCategoryModal.style.display = 'none';
            categoryForm.reset();
            document.getElementById('addImagePreview').innerHTML = '';
            clearErrors(categoryForm);
        }
    }


});

const sort = document.querySelector('.sort-by')
const filter = document.querySelector('.filter')
filter.addEventListener('change', applyFilters)
sort.addEventListener('change', applyFilters)

const tableBody = document.querySelector('.categories-table tbody');
const originalRows = Array.from(tableBody.getElementsByTagName('tr'));

function applyFilters() {

    const sort = document.querySelector('.sort-by')
    const filter = document.querySelector('.filter')

    const sortValue = sort.value.toLowerCase()
    const filterValue = filter.value.toLowerCase()

    const rows = Array.from(tableBody.getElementsByTagName('tr'))

    rows.forEach(row => {
        const status = row.querySelector('td:nth-child(7)')?.textContent.trim().toLowerCase();
        if (filterValue.toLowerCase() === 'all' || status.toLowerCase() === filterValue.toLowerCase()) {
            row.style.display = ''
        } else {
            row.style.display = 'none';
        }
    })

    if (sortValue !== 'default') {
        rows.sort((a, b) => {
            let aText = ''
            let bText = ''

            if (sortValue === 'name') {
                aText = a.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()
                bText = b.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()
            } else if (sortValue === 'description') {
                aText = a.querySelector('td:nth-child(3)')?.textContent.trim().toLowerCase()
                bText = b.querySelector('td:nth-child(3)')?.textContent.trim().toLowerCase()
            }

            return aText.localeCompare(bText)
        })
        rows.forEach(row => tableBody.appendChild(row))
    } else {
        originalRows.forEach(row => tableBody.appendChild(row))
    }
}

function validateForm(data) {
    const namePattern = /^[a-zA-Z\s]+$/;
    const digit = /^\d+$/;
    let error = {};

    const { categoryName, categoryDescription, offerPrice } = data;

    if (!categoryName) {
        error.categoryName = 'Please enter the Name';
    } else if (!namePattern.test(categoryName)) {
        error.categoryName = 'Name includes only alphabets';
    }

    if (!categoryDescription) {
        error.categoryDescription = 'Please enter the Description';
    }

    if (offerPrice && offerPrice !== '') {
        if (!digit.test(offerPrice)) {
            error.offerPrice = 'Offer includes only numbers';
        } else if (parseFloat(offerPrice) >= 100) {
            error.offerPrice = 'Offer should be under 100';
        }
    }

    return Object.keys(error).length > 0 ? error : null;
}

function showEditCategoryModal(id, name, description, offer, isListed, image) {
    console.log('offer : ', offer)
    const editCategoryModal = document.getElementById('editCategoryModal');
    const categoryId = document.getElementById('categoryId');
    const categoryName = document.getElementById('editCategoryName');
    const categoryDescription = document.getElementById('categoryDescription');
    const categoryOffer = document.getElementById('editOfferPrice');
    const categoryList = document.getElementById('checkbox');
    const currentImageDiv = document.getElementById('currentImage');

    if (!editCategoryModal || !categoryId || !categoryName || !categoryDescription || !categoryOffer || !categoryList || !currentImageDiv) {
        console.error('One or more modal elements not found');
        return;
    }

    categoryId.value = id;
    categoryName.value = name;
    categoryDescription.value = description;
    categoryOffer.value = offer || '';
    categoryList.checked = isListed;
    currentImageDiv.innerHTML = image
        ? `<img src="/Uploads/category/${image}" alt="Current Image" style="width: 50px; height: 50px; object-fit: fill;">`
        : 'No Image';
    editCategoryModal.style.display = 'block';
}

function hideEditCategoryModal() {
    const editCategoryModal = document.getElementById('editCategoryModal');
    if (editCategoryModal) {
        editCategoryModal.style.display = 'none';
        document.getElementById('EditCategoryForm').reset();
        document.getElementById('currentImage').innerHTML = '';
        clearErrors(document.getElementById('EditCategoryForm'));
    }
}

async function SaveChanges(event) {
    event.preventDefault();

    const editCategoryForm = document.getElementById('EditCategoryForm');
    const categoryId = document.getElementById('categoryId');
    const categoryName = document.getElementById('editCategoryName');
    const categoryDescription = document.getElementById('categoryDescription');
    const categoryOffer = document.getElementById('editOfferPrice');
    const categoryList = document.getElementById('checkbox');

    if (!categoryId || !categoryName || !categoryDescription || !categoryOffer || !categoryList) {
        console.error('One or more form elements not found');
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Form elements missing.',
        });
        return;
    }

    const formData = new FormData(editCategoryForm);
    formData.set('id', categoryId.value);
    formData.set('categoryName', categoryName.value.trim());
    formData.set('categoryDescription', categoryDescription.value.trim());
    formData.set('offerPrice', categoryOffer.value);
    formData.set('listCategory', categoryList.checked);

    const errors = validateForm({
        categoryName: formData.get('categoryName'),
        categoryDescription: formData.get('categoryDescription'),
        offerPrice: formData.get('offerPrice'),
    });

    if (errors) {
        displayFormError(editCategoryForm, errors);
        return;
    }

    try {
        const response = await fetch('/admin/editCategory', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('Category updated successfully.', 'success');
            location.reload()
        } else {
            if (data.errors) {
                displayFormError(editCategoryForm, data.errors);
            } else {
                showNotification(data.message || 'Something went wrong!', 'error');
            }
        }
    } catch (err) {
        console.error('Fetch Error:', err);
        return showNotification('Something went wrong. Try again later', 'error');
    }
}

async function addOffer(categoryId) {
    const { value: amount } = await Swal.fire({
        title: 'Offer in Percentage',
        input: 'number',
        inputLabel: 'Percentage',
        inputPlaceholder: '%',
    });

    if (amount) {
        try {
            const response = await fetch('/admin/addCategoryOffer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    percentage: amount,
                    categoryId: categoryId,
                }),
            });

            const data = await response.json();

            if (response.ok && data.status) {
                const offerButton = document.querySelector(`tr[data-id="${categoryId}"]`)
                const offerCell = document.querySelector('.offerCell')
                offerCell.textContent = `${dd}`

                return Swal.fire('Offer Added', 'The Offer Has Been Added', 'success')
            } else {
                return showNotification(data.message || 'Offer adding failed', 'error');
            }
        } catch (error) {
            console.error('Offer adding failed:', error.message);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    }
}

async function removeOffer(categoryId) {
    try {
        const response = await fetch('/admin/removeCategoryOffer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                categoryId: categoryId,
            }),
        });

        const data = await response.json();

        if (response.ok && data.status) {
            showNotification(data.message || 'The Offer has been removed', 'success')
            location.reload();
        } else {
            showNotification(data.message || 'Offer removing failed', 'error')
        }
    } catch (error) {
        console.error('Offer removing failed:', error);
        return showNotification('Something went wrong. Try again later', 'error');
    }
}

function displayFormError(form, errors) {
    clearErrors(form);
    Object.entries(errors).forEach(([field, message]) => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('is-invalid');
            let feedback = input.nextElementSibling;
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                input.parentNode.appendChild(feedback);
            }
            feedback.textContent = message;
        }
    });
}

function clearErrors(form) {
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    form.querySelectorAll('.invalid-feedback').forEach((el) => el.remove());
}

function updateCategoryTable(categories) {
    const tbody = document.querySelector('.categories-table tbody');
    tbody.innerHTML = '';

    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No categories found</td></tr>';
        return;
    }

    categories.forEach(category => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', category._id);

        // Image cell
        const imgCell = document.createElement('td');
        if (category.categoryImage) {
            const img = document.createElement('img');
            img.src = `/uploads/category/${category.categoryImage}`;
            img.alt = category.name;
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.objectFit = 'fill';
            imgCell.appendChild(img);
        } else {
            imgCell.textContent = 'No Image';
        }
        tr.appendChild(imgCell);

        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = category.name;
        tr.appendChild(nameCell);

        // Description
        const descCell = document.createElement('td');
        descCell.textContent = category.description;
        tr.appendChild(descCell);

        // Created At
        const dateCell = document.createElement('td');
        const createdAt = new Date(category.createdAt);
        dateCell.textContent = createdAt.toString().split(" ").slice(1, 4).join(" ");
        tr.appendChild(dateCell);

        // Offer Button
        const offerBtnCell = document.createElement('td');
        const btn = document.createElement('button');
        btn.classList.add('filter', 'offer-btn');
        if (!category.categoryOffer) {
            btn.textContent = 'Add Offer';
            btn.onclick = () => addOffer(category._id);
        } else {
            btn.textContent = 'Remove Offer';
            btn.onclick = () => removeOffer(category._id);
        }
        offerBtnCell.appendChild(btn);
        tr.appendChild(offerBtnCell);

        // Offer Value
        const offerCell = document.createElement('td');
        offerCell.classList.add('offerCell');
        offerCell.textContent = category.categoryOffer ? `${category.categoryOffer} %` : '-';
        tr.appendChild(offerCell);

        // Listed status
        const listedCell = document.createElement('td');
        listedCell.textContent = category.isListed ? 'Listed' : 'Unlisted';
        tr.appendChild(listedCell);

        // Actions
        const actionCell = document.createElement('td');
        const editLink = document.createElement('a');
        editLink.href = '#';
        editLink.classList.add('action-icon');
        editLink.innerHTML = '<i class="fas fa-edit"></i>';
        editLink.onclick = () => showEditCategoryModal(
            category._id,
            category.name,
            category.description,
            category.categoryOffer,
            category.isListed,
            category.categoryImage
        );
        actionCell.appendChild(editLink);
        tr.appendChild(actionCell);

        tbody.appendChild(tr);
    });
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