document.addEventListener('DOMContentLoaded', function () {

    // DOM Element Selection
    const profileSection = document.getElementById('profile-section');
    const profileForm = document.getElementById('profileForm');
    const formInputs = profileForm.querySelectorAll('input');
    const profilePicContainer = document.getElementById('profilePicContainer');
    const fileInput = document.getElementById('profileImage');
    const previewImg = document.getElementById('profilePreview');
    const editProfileButton = document.getElementById('editProfileButton');
    const cancelProfileButton = document.getElementById('cancelProfileButton');
    const passwordButton = document.getElementById('changePassword');
    const passwordSection = document.getElementById('password-section');
    const passwordModal = document.getElementById('passwordModal')
    const cancelPasswordButton = document.getElementById('cancelPasswordButton');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = changePasswordForm.querySelector('button[type="submit"]');

    // State Variables
    const originalValues = {};

    // Utility Functions
    function clearErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    function displayFormErrors(form, errors) {
        clearErrors(form);
        if (errors && typeof errors === 'object') {
            Object.entries(errors).forEach(([field, message]) => {
                const input = form.querySelector(`input[name="${field}"], .${field}`);
                if (input) {
                    input.classList.add('is-invalid');
                    const feedback = input.parentElement.querySelector('.invalid-feedback') || input.nextElementSibling;
                    if (feedback && feedback.classList.contains('invalid-feedback')) {
                        feedback.textContent = message;
                    }
                }
            });
        }
    }

    function displayFormError(field, message) {
        clearErrors(field === 'currentPassword' || field === 'newPassword' || field === 'confirmPassword' ? changePasswordForm : profileForm);
        const input = (field === 'currentPassword' || field === 'newPassword' || field === 'confirmPassword')
            ? changePasswordForm.querySelector(`[name="${field}"]`)
            : profileForm.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('is-invalid');
            const feedback = input.parentElement.querySelector('.invalid-feedback') || input.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = message;
            }
        }
    }

    function validateUser(data) {
        const namePattern = /^[A-Za-z\s]+$/;
        const emailPattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
        const phonePattern = /^\+?\d{1,4}[\s-]?\d{6,14}$/;
        let errors = {};

        if (!data.name) {
            errors.name = "First name is required!";
        } else if (!namePattern.test(data.name)) {
            errors.name = "Name can only contain letters and spaces!";
        } else if (!(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/).test(data.name.trim())) {
            errors.name = "Name can't allow multiple spaces!!";
        }
        if (!data.email) {
            errors.email = "Email is required!";
        } else if (!emailPattern.test(data.email)) {
            errors.email = "Invalid email format!";
        }
        if (!data.phone) {
            errors.phone = "Phone number is required!";
        } else if (!phonePattern.test(data.phone)) {
            errors.phone = "Phone number format is invalid!";
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    function validatePasswordForm(data) {
        let errors = {};

        if (!data.currentPassword) {
            errors.currentPassword = "Current password is required!";
        }

        if (!data.newPassword) {
            errors.newPassword = "New password is required!";
        } else if (data.newPassword.length < 8) {
            errors.newPassword = "New password must be at least 8 characters long!";
        }

        if (!data.confirmPassword) {
            errors.confirmPassword = "Confirm password is required!";
        } else if (data.newPassword !== data.confirmPassword) {
            errors.confirmPassword = "Passwords do not match!";
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    // Profile Section Logic
    formInputs.forEach(input => {
        originalValues[input.name] = input.value;
    });
    originalValues.profileImage = previewImg ? previewImg.src : '';

    profilePicContainer.addEventListener('click', function () {
        if (!fileInput.disabled) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            if (this.files[0].size > 5 * 1024 * 1024) {
                Swal.fire('Error', 'Profile picture must be less than 5MB.', 'error');
                this.value = '';
                return;
            }
            if (!this.files[0].type.startsWith('image/')) {
                Swal.fire('Error', 'Please upload a valid image file.', 'error');
                this.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                if (previewImg) {
                    previewImg.src = e.target.result;
                } else {
                    const newImg = document.createElement('img');
                    newImg.src = e.target.result;
                    newImg.id = 'profilePreview';
                    const placeholder = document.querySelector('.profile-placeholder');
                    if (placeholder) {
                        profilePicContainer.removeChild(placeholder);
                    }
                    profilePicContainer.appendChild(newImg);
                }
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Profile Form Event Listeners
    editProfileButton.addEventListener('click', function () {
        const user = JSON.parse(document.getElementById('profile-section').dataset.user)
        if (editProfileButton.textContent === 'Edit') {
            formInputs.forEach(input => input.disabled = false);
            if(user.googleId){
                document.getElementById('email').disabled = true
            }
            fileInput.disabled = false;
            passwordButton.style.display = 'none';
            editProfileButton.textContent = 'Save Changes';
            editProfileButton.className = 'btn-save';
            cancelProfileButton.style.display = 'inline-block';
            profilePicContainer.style.cursor = 'pointer';
            profilePicContainer.classList.add('editable');
        } else {
            submitForm();
        }
    });

    cancelProfileButton.addEventListener('click', function () {
        formInputs.forEach(input => {
            input.disabled = true;
            if (input.type !== 'file') {
                input.value = originalValues[input.name];
            }
        });

        editProfileButton.textContent = 'Edit';
        editProfileButton.className = 'btn-edit';
        cancelProfileButton.style.display = 'none';
        passwordButton.style.display = 'block';
        profilePicContainer.style.cursor = 'default';
        profilePicContainer.classList.remove('editable');
        clearErrors(profileForm);
        fileInput.disabled = true;
        fileInput.value = '';

        if (previewImg) {
            previewImg.src = originalValues.profileImage;
        } else if (!previewImg && originalValues.profileImage === '') {
            const placeholder = document.createElement('div');
            placeholder.className = 'profile-placeholder';
            placeholder.innerHTML = '<span class="plus-icon">+</span>';
            profilePicContainer.innerHTML = '';
            profilePicContainer.appendChild(placeholder);
            profilePicContainer.appendChild(fileInput);
        }
    });

    async function submitForm() {
        clearErrors(profileForm);
        const formData = new FormData(profileForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            if (key !== 'profileImage') {
                jsonData[key] = value.trim();
            }
        });

        let errors = validateUser(jsonData);
        if (errors) {
            displayFormErrors(profileForm, errors);
            return;
        }

        const emailChanged = jsonData.email !== originalValues.email;

        if (emailChanged) {
            const otpRes = await fetch('/sendOtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmail: jsonData.email })
            });

            const otpData = await otpRes.json();
            if (!otpData.success) {
                Swal.fire('Error', otpData.message, 'error');
                return;
            }

            const { value: enteredOtp } = await Swal.fire({
                title: 'Verify New Email',
                input: 'text',
                inputLabel: 'Enter the OTP sent to your new email',
                inputPlaceholder: 'Enter 6-digit OTP',
                confirmButtonText: 'Verify',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value || value.trim().length !== 6) return 'Please enter a valid 6-digit OTP';
                }
            });

            if (!enteredOtp) return;

            const verifyRes = await fetch('/verifyOTP', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: enteredOtp.trim() })
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                Swal.fire('Error', verifyData.message, 'error');
                return;
            }
            Swal.fire('Verified', verifyData.message, 'success');
        }

        try {
            const response = await fetch('/editProfile', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (!data.success) {
                if (data.errors) {
                    displayFormErrors(profileForm, data.errors);
                } else {
                    Swal.fire('Error', data.message || 'Failed to update profile.', 'error');
                }
                return;
            }

            Swal.fire('Success', data.message || 'Profile updated successfully!', 'success')
                .then(() => {
                    window.location.replace(data.redirectUrl);
                });
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire('Error', 'Something went wrong while updating the profile.', 'error');
        }
    }

    // Password Change Section
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(changePasswordForm);

        const formData = new FormData(changePasswordForm);
        const jsonData = Object.fromEntries(formData);

        // Trim values
        Object.keys(jsonData).forEach(key => {
            jsonData[key] = jsonData[key].trim();
        });

        let errors = validatePasswordForm(jsonData);
        if (errors) {
            displayFormErrors(changePasswordForm, errors);
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Updating...';

            const response = await fetch('/changePassword', {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!data.success) {
                if (data.errors) {
                    displayFormErrors(changePasswordForm, data.errors);
                } else {
                    Swal.fire('Error', data.message || 'Failed to update password.', 'error');
                }
                return;
            }

            Swal.fire('Success', data.message || 'Password updated successfully!', 'success')
                .then(() => {
                    changePasswordForm.reset();
                    profileSection.style.display = 'block';
                    passwordModal.style.display = 'none';
                    cancelPasswordButton.style.display = 'none';
                });

        } catch (error) {
            console.error('Error updating password:', error);
            Swal.fire('Error', 'Something went wrong while updating the password.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Update Password';
        }
    });

    // Section Navigation
    passwordButton.addEventListener('click', () => {
        profileSection.style.display = 'none';
        passwordModal.style.display = 'block';
        cancelPasswordButton.style.display = 'block';
    });

    cancelPasswordButton.addEventListener('click', () => {
        changePasswordForm.reset();
        clearErrors(changePasswordForm);
        profileSection.style.display = 'block';
        passwordModal.style.display = 'none';
        cancelPasswordButton.style.display = 'none';
    });

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

});