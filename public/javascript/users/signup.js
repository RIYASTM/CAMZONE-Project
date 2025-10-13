document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById('signupForm');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(signupForm);

        const formData = new FormData(signupForm);
        const jsonData = Object.fromEntries(formData);
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        let errors = validateUser(jsonData);
        if (errors) {
            displayFormErrors(signupForm, errors)
            return
        }

        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we create your account.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });

            const data = await response.json();

            if (!data.success) {
                displayFormErrors(signupForm, data.errors);
                showNotification(data.message || 'Validation error!', 'error');
            } else {
                window.location.replace(data.redirectUrl);
            }
        } catch (error) {
            console.error('Signup error:', error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    });

    function displayFormErrors(form, errors) {
        clearErrors(form);
        if (errors && typeof errors === 'object') {
            Object.entries(errors).forEach(([field, message]) => {
                const input = form.querySelector(`input[name="${field}"]`);
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

    function clearErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')

    search.addEventListener('keypress', async (e) => {

        const searchValue = search.value.trim()

        if (searchValue && e.key === 'Enter') {
            console.log('search : ', searchValue)
            // window.location = `/shop?search=${searchValue}`
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

});

function validateUser(data) {
    const namepattern = /^[A-Za-z\s]+$/;
    const emailpattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    const phonePattern = /^(?:\+91|91)?[6-9]\d{9}$/

    const alpha = /[a-zA-Z]/
    const digit = /\d/
    let error = {};

    if (!data.name) {
        error.name = "User name is required !!"
    } else if (!namepattern.test(data.name)) {
        error.name = "Name can only contain Alphabets and spaces !!"
    } else if (!(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/).test(data.name.trim())) {
        error.name = "Name can't allow multiple spaces!!"
    } else if (data.name.length < 4) {
        error.name = 'Name should contain min 4 characters!!'
    }
    if (!data.email) {
        error.email = "Email is required !!";
    } else if (!emailpattern.test(data.email)) {
        error.email = "Invalid Format !!"
    }
    if (!data.phone) {
        error.phone = "Phone is required !!"
    } else if (!phonePattern.test(data.phone)) {
        error.phone = "Invalid Phone Number!!"
    } else if (data.phone.length !== 10) {
        error.phone = "Phone number should 10 digits"
    }
    if (!data.password) {
        error.password = "Password is required !!"
    } else if (data.password.length < 8) {
        error.password = "Enter minimum 8 charactors !!"
    } else if (!alpha.test(data.password) || !digit.test(data.password)) {
        error.password = "Should contain Numbers and Alphabets !!"
    }
    if (!data.confirmPassword) {
        error.confirmPassword = "ConfirmPassword is required !!"
    } else if (data.password !== data.confirmPassword) {
        error.confirmPassword = "Passwords don`t match !!"
    }

    return Object.keys(error).length > 0 ? error : null;
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