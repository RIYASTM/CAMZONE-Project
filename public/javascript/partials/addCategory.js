document.addEventListener('DOMContentLoaded',function(){
    const categoryForm = document.getElementById('categoryForm')
    const addCategoryButton = document.getElementById('addCategoryButton')
    const addCategoryModal = document.getElementById('addCategoryModal')
    const cancelButton = document.getElementById('cancelButton')

    function showAddCategoryModal() {
        addCategoryModal.style.display = 'block'
    }

    function hideAddCategoryModal() {
        addCategoryModal.style.display = 'none'
    }

    addCategoryButton.addEventListener('click', showAddCategoryModal)

    cancelButton.addEventListener('click', hideAddCategoryModal)


    // console.log('Front: ',listCategory.checked)

    categoryForm.addEventListener('submit' , async (e) => {

        e.preventDefault()
        clearErrors(categoryForm)

        const categoryname = document.getElementById('addCategoryName').value
        const categoryDescription = document.getElementById('addCategoryDescription').value
        const offerPrice = document.getElementById('addOfferPrice').value
        const listCategory = document.getElementById('addCheckbox').checked

        console.log(categoryname)

        const formData = new FormData(categoryForm);
        const jsonData = Object.fromEntries(formData);
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        let errors = validateForm(jsonData)

        if(errors){
            displayFormError(categoryForm,errors)
            console.log( "From front : " ,errors)
            return
        }

        try {
            const response = await fetch('/admin/addCategory', {
                method : "POST",
                body : JSON.stringify({ name : categoryname , description : categoryDescription , isListed : listCategory , categoryOffer : offerPrice}),
                headers : {'Content-Type' : 'application/json'}
            })

            const data = await response.json()

            if(!data.success){
                Swal.fire('Error',data.message || 'Validation error', 'error')
            }else{
                Swal.fire('success', data.message || 'Category Adding Success', 'success')
                .then(()=> {
                    window.location.replace(data.redirectUrl)
                })
            }
        } catch (error) {
            console.error('Category adding error:', error);
            Swal.fire('Error', 'Something went wrong: ' + error.message, 'error');
        }
    })

    function displayFormError(categoryForm, errors){
        clearErrors(categoryForm)

        if(errors && typeof errors === 'object'){
            Object.entries(errors).forEach(([field,message]) => {
                const input = categoryForm.querySelector(`input[name="${field}"]`)

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

    function clearErrors(categoryForm){
        categoryForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
        categoryForm.querySelectorAll('.invalid-feedback').forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }
    
})

function validateForm(data) {
    const namePattern = /^[a-zA-Z\s]+$/;
    const digit = /^\d+$/;
    let error = {};

    if (!data.categoryName) {
        error.categoryName = 'Please enter the Name';
    } else if (!namePattern.test(data.categoryName)) {
        error.categoryName = 'Name includes only alphabets';
    }

    if (data.offerPrice) {
        if (!digit.test(data.offerPrice)) {
            error.offerPrice = 'Offer includes only numbers';
        } else if (parseFloat(data.offerPrice) >= 100) {
            error.offerPrice = 'Offer should be under 100';
        }
    }

    if (!data.categoryDescription) {
        error.categoryDescription = 'Please enter the Description';
    }

    return Object.keys(error).length > 0 ? error : null;
}