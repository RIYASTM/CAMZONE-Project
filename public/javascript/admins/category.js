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
                    Swal.fire('Error', 'File size exceeds 5MB limit!', 'error');
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
                    Swal.fire('Error', 'File size exceeds 5MB limit!', 'error');
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
                    Swal.fire('Error', data.message || 'Validation error', 'error');
                    if (data.errors) {
                        displayFormError(categoryForm, data.errors);
                    }
                } else {
                    Swal.fire('Success', data.message || 'Category Added Successfully', 'success').then(() => {
                        window.location.replace(data.redirectUrl);
                    });
                }
            } catch (error) {
                console.error('Category adding error:', error);
                Swal.fire('Error', 'Something went wrong: ' + error.message, 'error');
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
});

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
    categoryList.checked = isListed === 'true';
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
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Category updated successfully.',
            }).then(() => location.reload());
        } else {
            if (data.errors) {
                displayFormError(editCategoryForm, data.errors);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: data.message || 'Something went wrong!',
                });
            }
        }
    } catch (err) {
        console.error('Fetch Error:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred.',
        });
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
                },
                body: JSON.stringify({
                    percentage: amount,
                    categoryId: categoryId,
                }),
            });

            const data = await response.json();

            if (response.ok && data.status) {
                Swal.fire('Offer Added', 'The Offer Has Been Added', 'success').then(() => {
                    location.reload();
                });
            } else {
                Swal.fire('Failed', data.message || 'Offer adding failed', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'An error occurred while adding offer', 'error');
            console.error('Offer adding failed:', error.message);
        }
    }
}

async function removeOffer(categoryId) {
    try {
        const response = await fetch('/admin/removeCategoryOffer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                categoryId: categoryId,
            }),
        });

        const data = await response.json();

        if (response.ok && data.status) {
            Swal.fire('Offer Removed', 'The Offer has been removed', 'success').then(() => {
                location.reload();
            });
        } else {
            Swal.fire('Failed', data.message || 'Offer removing failed', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'An error occurred while removing offer', 'error');
        console.error('Offer removing failed:', error);
    }
}

async function deleteCategory(categoryId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/deleteCategory', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        categoryId: categoryId,
                    }),
                });

                const data = await response.json();

                if (response.ok && data.status) {
                    Swal.fire('Category Removed', 'The Category has been removed', 'success').then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire('Failed', data.message || 'Category removing failed', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'An error occurred while deleting category', 'error');
                console.error('Category removing failed:', error);
            }
        }
    });
}