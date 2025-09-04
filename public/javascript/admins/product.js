
document.addEventListener('DOMContentLoaded', () => {
    const regularPriceInput = document.getElementById('editRegularPrice');
    const productOfferInput = document.getElementById('editProductOffer');
    const salePriceInput = document.getElementById('editSalePrice');

    productOfferInput.addEventListener('input', () => {
        const regularPrice = parseFloat(regularPriceInput.value) || 0;
        const productOffer = parseFloat(productOfferInput.value) || 0;

        if (productOffer > 0) {
            const calculatedSale = regularPrice - (regularPrice * productOffer) / 100;
            salePriceInput.value = Math.round(calculatedSale);
            salePriceInput.readOnly = true;  
        } else {
            salePriceInput.readOnly = false; 
            salePriceInput.value = regularPrice;       
        }
    });
})

// Existing scripts from the original code
const search = document.getElementById('search');
const searchValue = search.value;

document.getElementById('search').addEventListener('keypress', function (e) {
    const searchValue = search.value;
    if (e.key === 'Enter') {
        window.location.href = `?search=${searchValue}`;
    }
});

if (searchValue) {
    document.getElementById('clear-button').addEventListener('click', function (e) {
        window.location.href = `/admin/products`;
    });
}

let cropper;
let currentImageIndex;
let currentModalType;
let croppedBlobs = {};
let existingImages = [];

const addProductModal = document.getElementById('addProductModal');
const editProductModal = document.getElementById('editProductModal');
const deleteProductModal = document.getElementById('deleteProductModal');
const addProductForm = document.getElementById('addProductForm');
const editProductForm = document.getElementById('editProductForm');

document.addEventListener('DOMContentLoaded', () => {
    // Add Product
    const addProductButton = document.getElementById('addProductButton');
    const cancelAddButton = document.getElementById('cancelAddProductButton');
    addProductButton.addEventListener('click', showAddProductModal);
    cancelAddButton.addEventListener('click', hideAddProductModal);

    // Edit Product
    const cancelEditButton = document.getElementById('cancelEditProductButton');
    cancelEditButton.addEventListener('click', hideEditProductModal);

    document.querySelectorAll('.editProductButton').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const id = button.dataset.id;
            const productName = button.dataset.name;
            const description = button.dataset.description;
            const brand = button.dataset.brand;
            const category = button.dataset.category;
            const regularPrice = button.dataset.regularprice;
            const salePrice = button.dataset.saleprice;
            const productOffer = button.dataset.productoffer;
            const stock = button.dataset.stock;
            const isBlocked = button.dataset.listed === 'true';
            const images = JSON.parse(button.dataset.images || '[]');
            const page = button.dataset.page

            showEditProductModal(id, productName, description, brand, category, regularPrice, salePrice, productOffer, stock, images, isBlocked, page);
        });
    });

    // Set up file input event listeners
    document.getElementById('productImages').addEventListener('change', handleFileSelect);
    document.getElementById('editProductImages').addEventListener('change', handleFileSelect);

    // Set up aspect ratio change listeners
    document.getElementById('cropperAspectRatio').addEventListener('change', updateCropperAspectRatio);
    document.getElementById('editCropperAspectRatio').addEventListener('change', updateCropperAspectRatio);

    // Initialize Cropper buttons
    document.getElementById('cropSaveButton').addEventListener('click', saveCroppedImage);
    document.getElementById('cropCancelButton').addEventListener('click', cancelCrop);
    document.getElementById('editCropSaveButton').addEventListener('click', saveCroppedImage);
    document.getElementById('editCropCancelButton').addEventListener('click', cancelCrop);

    // Delete Product
    document.querySelectorAll('.deleteProduct').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const id = button.dataset.id;
            const name = button.dataset.name;
            showDeleteProductModal(id, name);
        });
    });

    // Add Product Form Submission
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addProductForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        const errors = validateForm(jsonData);
        if (errors) {
            displayFormError(addProductForm, errors);
            return;
        }

        // Check for at least one image
        const hasImages = Object.keys(croppedBlobs).length > 0;
        if (!hasImages) {
            Swal.fire('Error', 'At least one product image is required!', 'error');
            return;
        }

        // Append cropped images to FormData
        Object.keys(croppedBlobs).forEach(index => {
            formData.append('productImage', croppedBlobs[index], `product-image-${index}.png`);
        });

        try {
            const response = await fetch('/admin/addProduct', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                Swal.fire('Error', data.message || 'Validation error', 'error');
                return;
            }
            Swal.fire('Success', data.message, 'success').then(() => {
                window.location.replace(data.redirectUrl);
            });
        } catch (error) {
            Swal.fire('Error', 'Something went wrong while adding product: ' + error.message, 'error');
        }
    });

    // Edit Product Form Submission
    editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(editProductForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        const errors = validateForm(jsonData);
        if (errors) {
            displayFormError(editProductForm, errors);
            return;
        }

        // Add existing images info to the form data
        existingImages.forEach((img, index) => {
            if (img) {
                formData.append('existingImages', img);
            }
        });

        // Append cropped images to FormData
        Object.keys(croppedBlobs).forEach(index => {
            formData.append('productImage', croppedBlobs[index], `product-image-${index}.png`);
        });

        try {
            const response = await fetch('/admin/editProduct', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!data.success) {
                Swal.fire('Error', data.message || 'Validation error', 'error');
                return;
            }
            Swal.fire('Success', data.message || 'Product edited successfully', 'success').then(() => {
                window.location.replace(data.redirectUrl);
            });
        } catch (error) {
            Swal.fire('Error', 'Something went wrong while editing product: ' + error.message, 'error');
        }
    });

    // Cancel Delete Button
    document.getElementById('cancelDeleteButton').addEventListener('click', hideDeleteProductModal);
});

// Helper functions for multiple image handling
function triggerFileInput() {
    const fileInput = document.getElementById(currentModalType === 'add' ? 'productImages' : 'editProductImages');
    if (fileInput) {
        fileInput.click();
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    currentModalType = event.target.id === 'productImages' ? 'add' : 'edit';
    const previewContainer = document.getElementById(currentModalType === 'add' ? 'imagePreviewContainer' : 'editImagePreviewContainer');

    // Find the next available slot (up to 4 images)
    let availableSlot = -1;
    for (let i = 0; i < 4; i++) {
        const box = previewContainer.querySelector(`.image-preview-box[data-index="${i}"]`);
        if (!box.querySelector('img')) {
            availableSlot = i;
            break;
        }
    }

    if (availableSlot === -1) {
        Swal.fire('Info', 'Maximum 4 images allowed. Please remove an image first.', 'info');
        return;
    }

    // Process the first selected file
    const file = files[0];
    currentImageIndex = availableSlot;

    // Initialize cropper
    const cropperContainer = document.getElementById(currentModalType === 'add' ? 'cropperContainer' : 'editCropperContainer');
    const cropperImage = document.getElementById(currentModalType === 'add' ? 'cropperImage' : 'editCropperImage');

    const reader = new FileReader();
    reader.onload = function (e) {
        cropperImage.src = e.target.result;
        cropperContainer.style.display = 'block';

        if (cropper) {
            cropper.destroy();
        }

        // Get aspect ratio from the selector
        const aspectRatioSelect = document.getElementById(currentModalType === 'add' ? 'cropperAspectRatio' : 'editCropperAspectRatio');
        const aspectRatio = parseFloat(aspectRatioSelect.value);

        cropper = new Cropper(cropperImage, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            data: {
                width: 600,
                height: 600
            }
        });
    };
    reader.readAsDataURL(file);
}

function updateCropperAspectRatio(event) {
    if (!cropper) return;

    const newAspectRatio = parseFloat(event.target.value);
    cropper.setAspectRatio(newAspectRatio);
}

function saveCroppedImage() {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
        width: 600,
        height: 600
    });

    canvas.toBlob(blob => {
        const previewContainer = document.getElementById(currentModalType === 'add' ? 'imagePreviewContainer' : 'editImagePreviewContainer');
        const previewBox = previewContainer.querySelector(`.image-preview-box[data-index="${currentImageIndex}"]`);

        // Clear previous content and add the image
        previewBox.innerHTML = '';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.alt = `Product Image ${currentImageIndex + 1}`;

        // Add remove button
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function (e) {
            e.stopPropagation();
            removeImage(currentModalType, currentImageIndex);
        };

        previewBox.appendChild(img);
        previewBox.appendChild(removeBtn);

        // Store the blob for later submission
        croppedBlobs[currentImageIndex] = blob;

        // Clear the file input
        document.getElementById(currentModalType === 'add' ? 'productImages' : 'editProductImages').value = '';

        resetCropper();
    }, 'image/png', 0.95);
}

function removeImage(modalType, index) {
    const previewContainer = document.getElementById(modalType === 'add' ? 'imagePreviewContainer' : 'editImagePreviewContainer');
    const previewBox = previewContainer.querySelector(`.image-preview-box[data-index="${index}"]`);

    // Clear the preview box
    previewBox.innerHTML = '';

    // Remove the blob from storage
    delete croppedBlobs[index];

    // For edit mode, mark the image as removed
    if (modalType === 'edit' && existingImages[index]) {
        existingImages[index] = null;
    }
}

function cancelCrop() {
    resetCropper();
    document.getElementById(currentModalType === 'add' ? 'productImages' : 'editProductImages').value = '';
}

function resetCropper() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropperContainer').style.display = 'none';
    document.getElementById('editCropperContainer').style.display = 'none';
}

function clearImagePreviews(modalType) {
    const previewContainer = document.getElementById(modalType === 'add' ? 'imagePreviewContainer' : 'editImagePreviewContainer');

    // Clear all preview boxes
    for (let i = 0; i < 4; i++) {
        const previewBox = previewContainer.querySelector(`.image-preview-box[data-index="${i}"]`);
        if (previewBox) {
            previewBox.innerHTML = '';
        }
    }

    // Reset stored data
    if (modalType === 'edit') {
        existingImages = [];
    }
    croppedBlobs = {};
}

// Modal Functions
function showAddProductModal() {
    addProductModal.style.display = 'block';
    croppedBlobs = {};
    currentModalType = 'add';
    clearImagePreviews('add');
}

function hideAddProductModal() {
    addProductModal.style.display = 'none';
    resetCropper();
    clearImagePreviews('add');
}

function showEditProductModal(id, name, description, brand, category, regularPrice, salePrice, productOffer, stock, images, isBlocked, page) {
    document.getElementById('productId').value = id;
    document.getElementById('editProductName').value = name;
    document.getElementById('editProductDescription').value = description;
    document.getElementById('editProductBrand').value = brand;
    document.getElementById('editProductCategory').value = category;
    document.getElementById('editRegularPrice').value = regularPrice;
    document.getElementById('editSalePrice').value = salePrice;
    document.getElementById('editProductOffer').value = productOffer;
    document.getElementById('editProductStock').value = stock;
    document.getElementById('editBlockProduct').checked = isBlocked;
    document.getElementById('page').value = page

    if (productOffer > 0) {
        const calculatedSale = regularPrice - (regularPrice * productOffer) / 100;
        const salePriceInput = document.getElementById('editSalePrice');
        salePriceInput.value = Math.round(calculatedSale); 
        salePriceInput.readOnly = true;
    } else {
        console.log("hi")
        const salePriceInput = document.getElementById('editSalePrice');
        salePriceInput.readOnly = false;
        salePriceInput.value = salePrice;
    }


    // Reset existing images and previews
    existingImages = Array(4).fill(null);
    clearImagePreviews('edit');
    croppedBlobs = {};
    currentModalType = 'edit';

    // Display existing images
    const previewContainer = document.getElementById('editImagePreviewContainer');
    images.forEach((image, index) => {
        if (index < 4 && image) {
            const previewBox = previewContainer.querySelector(`.image-preview-box[data-index="${index}"]`);
            previewBox.innerHTML = '';

            const img = document.createElement('img');
            img.src = `/uploads/products/${image}`;
            img.alt = `Product Image ${index + 1}`;

            // Add remove button
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-image';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = function (e) {
                e.stopPropagation();
                removeImage('edit', index);
            };

            previewBox.appendChild(img);
            previewBox.appendChild(removeBtn);

            // Store existing image reference
            existingImages[index] = image;
        }
    });

    editProductModal.style.display = 'block';
}

function hideEditProductModal() {
    editProductModal.style.display = 'none';
    resetCropper();
    clearImagePreviews('edit');
}

function showDeleteProductModal(id, name) {
    const deleteProductMessage = document.getElementById('deleteProductMessage');
    const confirmButton = document.getElementById('confirmDeleteButton');

    deleteProductMessage.textContent = `Are you sure you want to delete ${name}?`;

    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    newConfirmButton.addEventListener('click', () => deleteProduct(id));

    deleteProductModal.style.display = 'block';
}

function hideDeleteProductModal() {
    deleteProductModal.style.display = 'none';
}

async function deleteProduct(productId) {
    try {
        const response = await fetch('/admin/deleteProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            Swal.fire('Product Removed', 'The product has been removed', 'success').then(() => {
                // location.reload();
            });
        } else {
            Swal.fire('Failed', data.message || 'Product removal failed', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'An error occurred while deleting product', 'error');
        console.log('Product removal failed: ', error);
    }
}

// Error Handling
function clearErrors(productForm) {
    productForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    productForm.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
}

function displayFormError(productForm, errors) {
    clearErrors(productForm);

    if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([field, message]) => {
            const input = productForm.querySelector(`.${field}`);
            if (input) {
                input.classList.add('is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = message;
                }
            }
        });
    }
}

// Validation
function validateForm(data) {
    const salePrice = Number(data.salePrice);
    const regularPrice = Number(data.regularPrice);

    const digit = /^\d+(\.\d{1,2})?$/;
    let errors = {};

    if (!data.productName) {
        errors.productName = 'Name is required!';
    }

    if (!data.description) {
        errors.description = 'Description is required!';
    }

    if (!data.category) {
        errors.category = 'Please select a Category!';
    }

    if (!data.brand) {
        errors.brand = 'Please select a Brand!';
    }

    if (!regularPrice) {
        errors.regularPrice = 'Regular Price is required!';
    } else if (!digit.test(regularPrice)) {
        errors.regularPrice = 'Regular Price should be a valid number!';
    }

    if (!salePrice && !data.productOffer) {
        errors.salePrice = 'Sale Price is required!';
    } else if (!digit.test(salePrice)) {
        errors.salePrice = 'Sale Price should be a valid number!';
    } else if (salePrice > regularPrice) {
        errors.salePrice = 'Sale Price should be less than Regular Price!';
    }

    if (!data.stock) {
        errors.stock = 'Stock is required!';
    } else if (!digit.test(data.stock)) {
        errors.stock = 'Stock should be a whole number!';
    }

    if (data.productOffer) {
        if (parseInt(data.productOffer) >= 100) {
            errors.productOffer = 'Offer should be under 100!';
        } else if (parseInt(data.productOffer) < 0) {
            errors.productOffer = 'Negative value not acceptable!';
        } else if (!digit.test(data.productOffer)) {
            errors.productOffer = 'Offer should be a whole number!';
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}