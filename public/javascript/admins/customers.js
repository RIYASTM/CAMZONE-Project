
const search = document.getElementById('search')
const  searchValue = search.value

document.getElementById('search').addEventListener('keypress',function(e){
    const  searchValue = search.value

    if(e.key === 'Enter'){
        window.location.href = `?search=${searchValue}`
    }
})

if(searchValue){

document.getElementById('clear-button').addEventListener('click',function(e){

    window.location.href = `/admin/customers`
})
}