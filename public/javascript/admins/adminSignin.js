document.addEventListener("DOMContentLoaded",function (){
    const signinForm = document.getElementById('adminSigninForm')

    signinForm.addEventListener('submit',async (e) => {
        e.preventDefault()
        clearErrors(signinForm)

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        

        let errors = validateForm({email,password})
        if(errors){
            displayFormError(signinForm,errors)
            return
        }
        try {
            const response = await fetch('/admin/signin',{
                method : "POST",
                body : JSON.stringify({email,password}),
                headers : {'content-Type' : 'application/json'}
            })

            const data = await response.json()

            if(!response.ok && data.success !== true){
                Swal.fire('Error',data.message || 'Validation error', 'error')
            }else{
                Swal.fire('Success', data.message || 'Signin Success', 'success')
                .then(() => {
                    window.location.replace(data.redirectUrl)
                })
            }
        } catch (error) {
            console.error('Signup error:', error);
            Swal.fire('Error', 'Something went wrong: ' + error.message, 'error');
        }
    })
    function displayFormError(signinform,errors){
        clearErrors(signinform)

        if(errors && typeof errors === 'object' ){
            Object.entries(errors).forEach(([field,message]) => {
                const input = signinform.querySelector(`input[name = ${field}]`)

                if(input){
                    input.classList.add('is-invalid')
                    const feedback = input.nextElementSibling
                    if(feedback && feedback.classList.contains('invalid-feedback')){
                        feedback.textContent = message
                    }
                }
            })
        }
    }

    function clearErrors(signinform){
        signinform.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'))
        signinForm.querySelectorAll('.invalid-feedback').forEach(el => el.textcontent = '')
    }

})


function validateForm({email,password}){
const emailPattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
let error = {}

if(!email){
    error.email = 'Email is required!!'
}else if(!emailPattern.test(email)){
    error.email = 'Invalid Email'
}

if(!password){
    error.password = "Password is required!!"
}

return Object.keys(error).length > 0 ? error : null
}

