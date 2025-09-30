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

        window.location.href = `/admin/brands`
    })
}

const addBrandModal = document.getElementById('addBrandModal')

const editBrandModal = document.getElementById('editBrandModal')

document.addEventListener('DOMContentLoaded', () => {

    const addBrandButton = document.getElementById('addBrandButton')
    const cancelAddButton = document.getElementById('cancelAddButton')
    const addBrandForm = document.getElementById('addBrandForm')

    addBrandButton.addEventListener('click', showAddBrandModal)

    cancelAddButton.addEventListener('click', hideAddBrandModal)

    const cancelEditButton = document.getElementById('cancelEditButton')
    const editBrandForm = document.getElementById('editBrandForm')

    document.querySelectorAll('.editBrandButton').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id
            const name = button.dataset.name
            const description = button.dataset.description
            const image = button.dataset.image
            const brandOffer = button.dataset.brandoffer;
            const isBlocked = button.dataset.isblocked == 'true'

            showEditBrandModal(id, name, description, image, isBlocked, brandOffer)
        })
    })

    cancelEditButton.addEventListener('click', hideEditBrandModal)

    addBrandForm.addEventListener('submit', async (e) => {

        e.preventDefault()

        const formdata = new FormData(addBrandForm)
        const jsonData = Object.fromEntries(formdata)
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        const errors = validateForm(jsonData)

        if (errors) {
            displayFormError(addBrandForm, errors)
            return
        }

        try {
            const response = await fetch('/admin/addBrand', {
                method: 'POST',
                body: formdata
            })
            const data = await response.json();

            if (!data.success) {
                console.log('errot')
                const errorMessage = typeof data.message === 'object' ? Object.values(data.message).join(', ') : data.message;
                showNotification(errorMessage || 'Brand adding failed', 'error')
                return false;
            }
            const errorMessage = typeof data.message === 'object' ? Object.values(data.message).join(', ') : data.message;
            showNotification( errorMessage || 'Brand added successfully', 'success')
            window.location.replace(data.redirectUrl);
        } catch (error) {
            console.error('Something went wrong : ',error.message)
        }
    })

    editBrandForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const formdata = new FormData(editBrandForm)
        const jsonData = Object.fromEntries(formdata)
        const isBlockedValue = formdata.get('isBlocked') === 'on' ? true : false;
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        const errors = validateForm(jsonData)

        if (errors) {
            displayFormError(editBrandForm, errors)
            return
        }

        try {
            const response = await fetch('/admin/editBrand', {
                method: 'POST',
                body: formdata
            })
            const data = await response.json(); 

            if (!data.ok && data.success !== true) {
                const errorMessage = typeof data.message === 'object' ? Object.values(data.message).join(', ') : data.message;
                showNotification(errorMessage || 'Validation error', 'error')
                return false;
            } else {
                const errorMessage = typeof data.message === 'object' ? Object.values(data.message).join(', ') : data.message;
                showNotification(errorMessage || 'Brand edited successfully', 'success')
                window.location.replace(data.redirectUrl);
            }
        } catch (error) {
            console.log( "Something went wrong while editing brand", error.message)
        }
    })

    const sort = document.querySelector('.sort-by')
    const filter = document.querySelector('.filter')
    filter.addEventListener('change', applyFilters)
    sort.addEventListener('change', applyFilters)

})

const tableBody = document.querySelector('.brands-table tbody');
const originalRows = Array.from(tableBody.getElementsByTagName('tr'));

function applyFilters() {

    const sort = document.querySelector('.sort-by')
    const filter = document.querySelector('.filter')

    const sortValue = sort.value.toLowerCase()
    const filterValue = filter.value.toLowerCase()

    const rows = Array.from(tableBody.getElementsByTagName('tr'))

    rows.forEach(row => {
        const status = row.querySelector('td:nth-child(6)')?.textContent.trim().toLowerCase();
        if(filterValue.toLowerCase() === 'all' || status.toLowerCase() === filterValue.toLowerCase()){
            row.style.display = ''
        }else{
            row.style.display = 'none';
        }
    })

    if(sortValue !== 'default'){
        rows.sort((a,b) => {
            let aText = ''
            let bText = ''

            if(sortValue === 'name'){
                aText = a.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()
                bText = b.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()
            }else if( sortValue === 'description'){
                aText = a.querySelector('td:nth-child(3)')?.textContent.trim().toLowerCase()
                bText = b.querySelector('td:nth-child(3)')?.textContent.trim().toLowerCase()
            }

            return aText.localeCompare(bText)
        })
        rows.forEach(row => tableBody.appendChild(row))
    }else{
        originalRows.forEach(row => tableBody.appendChild(row))
    }
}


function showAddBrandModal() {
    addBrandModal.style.display = 'block'
}

function hideAddBrandModal() {
    addBrandModal.style.display = 'none'
}

function hideEditBrandModal() {
    editBrandModal.style.display = 'none'
}

function showEditBrandModal(id, name, description, image, isBlocked, brandOffer) {
    const editBrandModal = document.getElementById('editBrandModal');
    document.getElementById('brandId').value = id;
    document.getElementById('editBrandName').value = name;
    document.getElementById('editBrandDescription').value = description;
    document.getElementById('editCheckbox').checked = isBlocked == true;
    document.getElementById('editBrandOffer').value = brandOffer ? brandOffer : '';
    const currentImageDiv = document.getElementById('currentImage');
    if (image) {
        currentImageDiv.innerHTML = `<img src="/uploads/brands/${image}" alt="Current Image" style="width: 50px; height: 50px; object-fit: fill;">`;
    } else {
        currentImageDiv.innerHTML = 'No Image';
    }
    editBrandModal.style.display = 'block'
}

async function deleteBrand(brandId) {

    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/deleteBrand', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        brandId: brandId
                    })
                })

                const data = await response.json()

                if (response.ok && data.success === true) {
                    showNotification(data.message || 'The Brand has been removed', 'success')
                    location.reload()
                } else {
                    showNotification(data.message || 'Brand removing failed', 'error')
                }
            } catch (error) {
                console.error('Brand removing failed : ', error)
            }
        }
    })
}

function clearErrors(brandForm) {
    brandForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
    brandForm.querySelectorAll('.invalid-feedback').forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

function displayFormError(brandForm, errors) {
    clearErrors(brandForm)

    if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([field, message]) => {

            const input = brandForm.querySelector(`.${field}`)

            if (input) {
                input.classList.add('is-invalid')
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = message
                } else {
                    const feedbackDiv = document.createElement('div');
                    feedbackDiv.className = 'invalid-feedback';
                    feedbackDiv.textContent = message;
                    input.parentNode.appendChild(feedbackDiv);
                }
            }
        })
    }
}

function validateForm(data) {

    const namePattern = /^[a-zA-Z\s]+$/
    const digit = /^\d+$/;
    const error= {}

    if(!data.brandName){
        error.brandName = 'Brand name is required!!'
    }else if(!namePattern.test(data.brandName)){
        error.brandName = 'Brand name only included with Alphabets'
    } else if(data.brandName.trim().length < 4){
        error.brandName = 'Brand name should contain min 4 characters!!'
    } else if (data.brandName.trim().length > 10){
        error.brandName = 'Invalid name!!'
    }

    if(!data.description){
        error.description = 'Brand description is required!!'
    } else if(data.description.trim().length > 50){
        error.description = 'Description is too long!!'
    }

    if(data.brandOffer){
        if(!digit.test(data.brandOffer)){
            error.brandOffer = 'Offer should be a number!!'
        }else if(data.brandOffer >= 99){
            error.brandOffer = 'Offer should be under 100 %!!'
        }
    }

    return Object.keys(error).length > 0 ? error : null
}

function showNotification(message, type) {
    const displayMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    console.log('Notification message:', displayMessage, 'Type:', type);

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = displayMessage;

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

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}