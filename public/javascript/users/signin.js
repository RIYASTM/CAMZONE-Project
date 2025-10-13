document.addEventListener("DOMContentLoaded", function () {
    const signinForm = document.getElementById('signinForm')

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        clearErrors(signinForm)

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        let errors = validateForm({ email, password })
        if (errors) {
            displayFormError(signinForm, errors)
            return
        }
        try {
            const response = await fetch('/signin', {
                method: "POST",
                body: JSON.stringify({ email, password }),
                headers: { 'content-Type': 'application/json', 'Accept': 'application/json' }
            })

            const data = await response.json()

            if (!data.success) {
                showNotification(data.message || 'Vallidation error', 'error');
            } else {
                window.location.replace(data.redirectUrl)
            }
        } catch (error) {
            console.error('Signup error:', error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    })
    
    function displayFormError(signinform, errors) {
        clearErrors(signinform)

        if (errors && typeof errors === 'object') {
            Object.entries(errors).forEach(([field, message]) => {
                const input = signinform.querySelector(`input[name = ${field}]`)

                if (input) {
                    input.classList.add('is-invalid')
                    const feedback = input.nextElementSibling
                    if (feedback && feedback.classList.contains('invalid-feedback')) {
                        feedback.textContent = message
                    }
                }
            })
        }
    }

    function clearErrors(signinform) {
        signinform.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
        signinForm.querySelectorAll('.invalid-feedback').forEach(el => el.textcontent = '')
    }

    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')
    
    search.addEventListener('keypress', async (e)=> {

        const searchValue = search.value.trim()

        if( searchValue && e.key === 'Enter' ){
            console.log('search : ',searchValue)
            // window.location = `/shop?search=${searchValue}`
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

})


function validateForm({ email, password }) {
    const emailPattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    let error = {}

    if (!email) {
        error.email = 'Email is required!!'
    } else if (!emailPattern.test(email)) {
        error.email = 'Invalid Email'
    }

    if (!password) {
        error.password = "Password is required!!"
    }

    return Object.keys(error).length > 0 ? error : null
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add styles
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

    // Add animation styles
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

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}