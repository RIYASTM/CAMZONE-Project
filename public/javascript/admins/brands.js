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

    window.location.href = `/admin/brands`
})
}

const addBrandModal = document.getElementById('addBrandModal')

const editBrandModal = document.getElementById('editBrandModal')


document.addEventListener('DOMContentLoaded',()=>{

    //Add Brand
    const addBrandButton = document.getElementById('addBrandButton')
    const cancelAddButton = document.getElementById('cancelAddButton')
    const addBrandForm = document.getElementById('addBrandForm')
    

    addBrandButton.addEventListener('click', showAddBrandModal)

    cancelAddButton.addEventListener('click', hideAddBrandModal)


    //Edit Brand
    const cancelEditButton = document.getElementById('cancelEditButton')
    const editBrandForm = document.getElementById('editBrandForm')


    document.querySelectorAll('.editBrandButton').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id
            const name = button.dataset.name
            const description = button.dataset.description
            const image = button.dataset.image
            const isBlocked = button.dataset.isblocked == 'true' 

            showEditBrandModal(id, name, description, image, isBlocked)
        })
    })

    

    // editBrandButton.addEventListener('click', showEditBrandModal)

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

        console.log('jsonData : ',jsonData)

        const errors = validateForm(jsonData)

        console.log('validation errors : ',errors)

        if(errors){
            displayFormError(addBrandForm, errors)
            return
        }

        try {
            const response = await fetch('/admin/addBrand', {
            method : 'POST',
            body: formdata
        })
        const data = await response.json();

        if(!data.success){
            console.log('errot')
            Swal.fire('Error', data.message || 'Validation error' , 'error');
            return false;
        }
            Swal.fire('success', data.message || 'Category added successfully' , 'success')
            .then(() => {
                window.location.replace(data.redirectUrl);
            })
        
        } catch (error) {
            console.log(error.message)
        }
    })

    editBrandForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const formdata = new FormData(editBrandForm)
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
            displayFormError(editBrandForm, errors)
            return
        }

        try {
            const response = await fetch('/admin/editBrand', {
            method : 'POST',
            body: formdata
        })
        const data = await response.json();

        if(!data.ok && data.success !== true){
            console.log('error')
            Swal.fire('Error', data.message || 'Validation error' , 'error');
            return false;
        }else{
           

            Swal.fire('success', data.message || 'Category edited successfully', 'success')
            .then(() => {
                window.location.replace(data.redirectUrl);
            })
        }
           
        } catch (error) {
            console.log(error.message)
            Swal.fire('Error', "Something went wrong while editing brand" , 'error')
        }
    })

})

//Add Brand

function showAddBrandModal(){
        addBrandModal.style.display = 'block'
}

function hideAddBrandModal(){
    addBrandModal.style.display = 'none'
}

//Edit Brand

function hideEditBrandModal(){
        editBrandModal.style.display = 'none'
    }

function showEditBrandModal(id, name, description, image, isBlocked){
        const editBrandModal = document.getElementById('editBrandModal');
        document.getElementById('brandId').value = id;
        document.getElementById('editBrandName').value = name;
        document.getElementById('editBrandDescription').value = description;
        document.getElementById('editCheckbox').checked = isBlocked == true ;
        const currentImageDiv = document.getElementById('currentImage');
        if (image) {
            currentImageDiv.innerHTML = `<img src="/uploads/brands/${image}" alt="Current Image" style="width: 50px; height: 50px; object-fit: fill;">`;
        } else {
            currentImageDiv.innerHTML = 'No Image';
        }
        editBrandModal.style.display = 'block'
    }


//Delete Brand

async function deleteBrand(brandId){

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
            
            const response = await fetch('/admin/deleteBrand',{
                method : "POST",
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify({
                    brandId : brandId
                })
            })

            const data = await response.json()

            if(response.ok && data.success === true){
                Swal.fire(
                    'Brand Removed',
                    'The Brand has been removed',
                    'success'
                ).then(()=>{
                    location.reload()
                })
            }else{
                Swal.fire( 'Failed', data.message || 'Brand removing failed', 'error' )
            }

        } catch (error) {
            wal.fire(
                'Error',
                'An error iccurred while deleting Brand',
                'error'
            )
            console.log('Brand removing failed : ',error)
        }
        }
        

    })
}


function clearErrors(brandForm){
    brandForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
    brandForm.querySelectorAll('.invalid-feedback').forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

function displayFormError(brandForm, errors){
    clearErrors(brandForm)

    if(errors && typeof errors === 'object'){
        Object.entries(errors).forEach(([field,message]) => {

            const input = brandForm.querySelector(`.${field}`) 
                                                    
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

function validateForm(data){

    const namePattern = /^[a-zA-Z\s]+$/
    let error = {}

    if(!data.brandName){
        error.brandName = 'Please enter the Name'

    }else if(!namePattern.test(data.brandName)){
        error.brandName = 'Name includes only the alphabets'

    }

    if(!data.description){
        error.description = 'Please enter the Discription'
    }


    return Object.keys(error).length > 0 ? error : null

}
