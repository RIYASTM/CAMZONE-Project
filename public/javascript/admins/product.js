

const search = document.getElementById('search')
const searchValue = search.value

document.getElementById('search').addEventListener('keypress',function(e){
    const  searchValue = search.value

    if(e.key === 'Enter'){
        window.location.href = `?search=${searchValue}`
    }
})

if(searchValue){

document.getElementById('clear-button').addEventListener('click',function(e){

    window.location.href = `/admin/product`
})
}

const addProductModal = document.getElementById('addProductModal')
const editProductModal = document.getElementById('editProductModal')
const deleteProductModal = document.getElementById('deleteProductModal')

document.addEventListener('DOMContentLoaded', () => {


    //Add Porduct
    
    const addProductButton = document.getElementById('addProductButton')
    const cancelAddButton = document.getElementById('cancelAddProductButton')
    const addProductForm = document.getElementById('addProductForm')

    addProductButton.addEventListener('click', showAddProductModal)

    cancelAddButton.addEventListener('click', hideAddProdcutModal)


    //Edit Product
    const cancelEditButton = document.getElementById('cancelEditProductButton')
    const editProductForm = document.getElementById('editProductForm')
    
    cancelEditButton.addEventListener('click',hideEditProductModal)



    document.querySelectorAll('.editProductButton').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id
            const productName = button .dataset.productName
            const description = button.dataset.description
            const brand = button.dataset.brand
            const catagory = button.dataset.catagory
            const regularPrice = button.dataset.regularPrice
            const salePrice = button.dataset.salePrice
            const productOffer = button.dataset.productOffer
            const stock = button.dataset.quantity
            const image = button.dataset.productImage
            const isBlocked = button.dataset.isBlocked == 'true'

            showEditProductModal(id, productName, description,brand, catagory, regularPrice, salePrice , productOffer, stock , image , isBlocked)
        })
    })


    //Adding Product

    addProductForm.addEventListener('submit' , async (e) => {

        e.preventDefault()

        const formdata = new FormData(addProductForm)
        const jsonData = Object.fromEntries(formdata)
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        console.log('jsonData : ',jsonData)

        const errors = validateForm(jsonData)

        console.log('validation errors : ',errors)

        if(errors){
            displayFormError(addProductForm, errors)
            return
        }

        try {
            
            const response = await fetch('/admin/addProduct', {
                method : 'POST',
                body : formdata
            })

            const data = await response.json()

            if(!data.success){
                console.log('errot')
                Swal.fire('Error', data.message || 'Validation error' , 'error');
                return false;
            }
                Swal.fire('success', data.message || 'Product added successfully' , 'success')
                .then(() => {
                    window.location.replace(data.redirectUrl);
                })

        } catch (error) {
            
            console.log(error.message)
            Swal.fire('Error', "Something went wrong while adding product" , 'errror')

        }
    })


    // Editing Product

    editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const formdata = new FormData(editProductForm)
        const jsonData = Object.fromEntries(formdata)
        const isBlockedValue = formdata.get('isBlocked') === 'on' ? true : false;
        console.log('isBlocked (boolean):', isBlockedValue);
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        console.log('jsonData : ',jsonData)

        const errors = validateForm(jsonData)

        console.log('validation errors : ',errors)

        if(errors){
            displayFormError(editProductForm, errors)
            return
        }

        try {
            const response = await fetch('/admin/editProduct', {
            method : 'POST',
            body: formdata
        })
        const data = await response.json();

        if(!data.ok && data.success !== true){
            // console.log('error')
            Swal.fire('Error', data.message || 'Validation error' , 'error');
            return false;
        }else{
            //    console.log('hii')
            Swal.fire('success', data.message || 'Product edited successfully', 'success')
            .then(() => {
                window.location.replace(data.redirectUrl);
            })
        }
           
        } catch (error) {
            console.log(error.message)
            Swal.fire('Error', "Something went wrong while editing product" , 'errror')
        }
    })


})

// Add Product

function showAddProductModal(){
    addProductModal.style.display = 'block'
}

function hideAddProdcutModal(){
    addProductModal.style.display = 'none'
}


//Edit Product

function showEditProductModal(id , name , description , brand , category , regularPrice , salePrice , productOffer , stock , image , isBlocked){
    const editProductModal = document.getElementById('editProductModal')

    document.getElementById('productId').value = id
    document.getElementById('editProductName').value = name
    document.getElementById('editProductDescription').value = description
    document.getElementById('productBrand').value = brand
    document.getElementById('productCategory').value = category
    document.getElementById('editRegularPrice').value = regularPrice
    document.getElementById('editSalePrice').value = salePrice
    document.getElementById('editProductOffer').value = productOffer
    document.getElementById('editProductStock').value = stock
    document.getElementById('editBlockProduct').checked = isBlocked == true ;

    const currentImageDiv = document.getElementById('currentImage')
    if (image) {
        currentImageDiv.innerHTML = `<img src="/uploads/products/${image}" alt="Current Image" style="width: 50px; height: 50px; object-fit: fill;">`;
    } else {
        currentImageDiv.innerHTML = 'No Image';
    }
    editProductModal.style.display = 'block'
}

function hideEditProductModal(){
    editProductModal.style.display = 'none'
}

//Delete Product

function hideDeleteProductModal(){
    deleteProductModal.style.display = 'none'
}
        

// Error Removing

function clearErrors(productForm){
    productForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
    productForm.querySelectorAll('.invalid-feedback').forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

// Error Display

function displayFormError(productForm, errors){
    clearErrors(productForm)

    if(errors && typeof errors === 'object'){
        Object.entries(errors).forEach(([field,message]) => {

            const input = productForm.querySelector(`.${field}`) 
                                                    
            if(input){
                input.classList.add('is-invalid')
                const feedback = input.nextElementSibling;
                if(feedback && feedback.classList.contains('invalid-feedback')){
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

// Validation

function validateForm(data){

    const digit = /\d/

    let error = {}

    if(!data.name){
        error.name = 'Name is required!!'
    }

    if(!data.description){
        error.description = 'Description is required!!'
    }

    if(!data.catagory){
        error.catagory = 'Please select Category!!'
    }

    if(!data.brand){
        error.brand = 'Please select Brand!!'
    }

    if(!data.regularPrice){
        error.regularPrice = 'Regular Price is required!!'
    }else if(!digit.test(data.regularPrice)){
        error.regularPrice = 'Regular Price should be in digits!!'
    }

    if(!data.salePrice){
        error.salePrice = 'Regular Price is required!!'
    }else if(!digit.test(data.salePrice)){
        error.salePrice = 'Regular Price should be in digits!!'
    }

    if(!data.stock){
        error.stock = 'Stock is required!!'
    }else if(!digit.test(data.stock)){
        error.stock = 'Stock should be in digits!!'
    }

    if(data.productOffer){
        if(data.offer >= 100 ){
            error.offer = 'Offer should be under 100!!'
        }else if(data.offer < 0){
            error.offer = 'Negative value not acceptable!!'
        }else if(!digit.test(data.offer)){
            error.offer = 'Offer should be in digits!!'
        }
    }

    if(!data.productImage.file){
        error.productImage = 'Select an image!!'
    }

    return Object.keys(error).length > 0 ? error : null

}