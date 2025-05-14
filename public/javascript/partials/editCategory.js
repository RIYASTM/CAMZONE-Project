
document.addEventListener('DOMContentLoaded', () => {
    const editCategoryModal = document.getElementById('editCategoryModal');
    const editCategoryForm = document.getElementById('EditCategoryForm');
    const cancelEditButton = document.getElementById('cancelEditButton');

    // Handle form submission for Edit Category
    editCategoryForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        await SaveChanges(event);
    });

    // Close modal on Cancel button click
    cancelEditButton.addEventListener('click', () => {
        hideEditCategoryModal();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === editCategoryModal) {
            hideEditCategoryModal();
        }
    });
});

function showEditCategoryModal(id, name, description, offer, isListed) {
    const editCategoryModal = document.getElementById('editCategoryModal');
    const categoryId = document.getElementById('categoryId');
    const categoryName = document.getElementById('editCategoryName');
    const categoryDescription = document.getElementById('categoryDescription');
    const categoryOffer = document.getElementById('editOfferPrice');
    const categoryList = document.getElementById('checkbox');

    // Populate form fields
    categoryId.value = id;
    categoryName.value = name;
    categoryDescription.value = description;
    categoryOffer.value = offer || '';
    categoryList.checked = isListed === 'true';

    // Show the modal
    editCategoryModal.style.display = 'block';
}

function hideEditCategoryModal() {
    const editCategoryModal = document.getElementById('editCategoryModal');
    editCategoryModal.style.display = 'none';
}

async function SaveChanges(event) {
    event.preventDefault(); // Prevent form from submitting the default way

    const categoryId = document.getElementById('categoryId');
    const categoryName = document.getElementById('editCategoryName');
    const categoryDescription = document.getElementById('categoryDescription');
    const categoryOffer = document.getElementById('editOfferPrice');
    const categoryList = document.getElementById('checkbox');

    try {
        const response = await fetch('/admin/editCategory', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: categoryId.value,
                name: categoryName.value,
                description: categoryDescription.value,
                categoryOffer: categoryOffer.value,
                isListed: categoryList.checked
            })
        });

        const data = await response.json();

        if (response.ok && data.success === true) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Category updated successfully.'
            }).then(() => location.reload());
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || 'Something went wrong!'
            });
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred.'
        });
    }
}