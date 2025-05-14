

// Search Managing

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

    window.location.href = `/admin/category`
})
}

async function addOffer(categoryId){
    const {value:amount} = await Swal.fire({
        title : 'Offer in Percentage',
        input : 'number',
        inputLabel : 'Percentage',
        inputPlaceholder : '%'
    })

    if(amount){

        try {
            
            const response = await fetch('/admin/addcategoryOffer',{
                method : "POST",
                headers : {
                 'Content-Type' : 'application/json'   
                },
                body : JSON.stringify({
                    percentage : amount,
                    categoryId : categoryId
                }),
            })

            const data = await response.json()

            if(response.ok && data.status === true){
                Swal.fire(
                    'Offer Added',
                    'The Offer Has Been Added',
                    'success',
                ).then(()=>{
                    location.reload()
                })
            }else{
                Swal.fire("Failed",data.message || "Offer adding failed",'error')
            }

        } catch (error) {
            Swal.fire(
                'Error',
                'An error iccurred while adding offer',
                'error'
            )
            console.log('Offer adding failed!!! : ',error.message  )
        }
    }
}


async function  removeOffer(categoryId){

    try {
        
        const response = await fetch('/admin/removeCategoryOffer',{
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
                categoryId : categoryId
            })
        })

        const data = await response.json()

        if(response.ok && data.status === true){
            Swal.fire(
                'Offer Removed',
                'The Offer has been removed',
                'success'
            ).then(()=>{
                location.reload()
            })
        }else{
            Swal.fire( 'Failed', data.message || 'Offer removing failed', 'error' )
        }

    } catch (error) {
        wal.fire(
            'Error',
            'An error iccurred while removing offer',
            'error'
        )
        console.log('Offer removing failed : ',error)
    }
}

async function deleteCategory(categoryId){

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
                
                const response = await fetch('/admin/deleteCategory',{
                    method : "POST",
                    headers : {
                        'Content-Type' : 'application/json'
                    },
                    body : JSON.stringify({
                        categoryId : categoryId
                    })
                })

                const data = await response.json()

                if(response.ok && data.status === true){
                    Swal.fire(
                        'Category Removed',
                        'The Category has been removed',
                        'success'
                    ).then(()=>{
                        location.reload()
                    })
                }else{
                    Swal.fire( 'Failed', data.message || 'Category removing failed', 'error' )
                }

            } catch (error) {
                wal.fire(
                    'Error',
                    'An error iccurred while deleting category',
                    'error'
                )
                console.log('Category removing failed : ',error)
            }

        }
    })
}