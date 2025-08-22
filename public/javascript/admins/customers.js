
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

        window.location.href = `/admin/customers`
    })
}

const blockCustomerModal = document.getElementById('blockCustomerModal')

document.addEventListener('DOMContentLoaded', () => {


    document.querySelectorAll('.blockCustomer').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault()
            const btn = e.currentTarget
            console.log('clicked button : ', btn)
            const id = btn.dataset.id
            const name = btn.dataset.name
            const page = btn.dataset.page
            const isBlocked = btn.dataset.blocked
            showBlockCustomerModal(id, name, page, btn, isBlocked)
        })
    })


    document.getElementById('cancelBlockButton').addEventListener('click', hideBlockCustomerModal)
})

function showBlockCustomerModal(id, name, page, btn, isBlocked) {

    blockCustomerModal.style.display = 'block'

    const blockCustomerMessage = document.getElementById('blockCustomerMessage')
    const confirmButton = document.getElementById('confirmBlockButton')
    console.log('isBlocked : ', isBlocked)

    if (isBlocked === true || isBlocked === 'true') {
        blockCustomerMessage.textContent = `Are you sure to unblock ${name}?`
        confirmButton.textContent = 'Unblock'
    } else {
        blockCustomerMessage.textContent = `Are you sure to block ${name}?`
        confirmButton.textContent = 'Block'
    }
    confirmButton.onclick = () => blockCustomer(id, page, btn);

}

function hideBlockCustomerModal() {

    blockCustomerModal.style.display = 'none'
}




async function blockCustomer(id, page, btn) {
    try {
        console.log('clicked : ', id)
        const response = await fetch('/admin/blockCustomer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, currentPages: page })
        })

        const data = await response.json()
        if (response.ok && data.success) {
            if (data.done === 'Blocked') {
                btn.textContent = 'Unblock'
                btn.dataset.blocked = 'true';
                Swal.fire('Blocked', data.message, 'success')
                // blockCustomerModal.style.display = 'none'
            } else if (data.done === 'Unblocked') {
                btn.textContent = 'Block'
                btn.dataset.blocked = 'false';
                Swal.fire('Unblocked', data.message, 'success')
                // blockCustomerModal.style.display = 'none'
            }

            blockCustomerModal.style.display = 'none'
        } else {
            Swal.fire('error', data.message || 'Customer modification failed')
        }
    } catch (error) {
        Swal.fire('error', 'An error occurred while update customer', 'error')
        // console.log('Customer updation failed : ', error)
    }
}

