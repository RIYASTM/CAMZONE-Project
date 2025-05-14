

 // Timer functionality
              
 document.addEventListener('DOMContentLoaded', function() {
    const verifyOtpForm = document.getElementById('verifyOtpForm');

    console.log(verifyOtpForm, 'form')

    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('text')
        const otp = document.getElementById('otp').value
        console.log(otp)

        try {
            const response = await fetch('/verify-email', {
                method: 'POST',
                body: JSON.stringify({otp}),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            console.log(data)

            if (data.success) {
                Swal.fire('Success',data.message || ' successful', 'success')
                .then(() => {
                    window.location.href = data.redirectUrl || '/';
                });
            }else{
                Swal.fire('Failed', data.message || 'Invalid OTP' , 'error')
            }
        } catch (error) {
            console.error('Signup error:', error);
            Swal.fire('Error', 'Something went wrong: ' + error.message, 'error');
        }
    });






    let timerElement = document.getElementById('timer');
    let resendLink = document.getElementById('resend-link');
    let seconds = parseInt(timerElement.textContent);
    
    let countdownInterval = setInterval(() => {
        seconds--;
        timerElement.textContent = seconds + ' s';
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('verify-btn').disabled = true
            resendLink.classList.add('active');
        }
    }, 1000);
    
    resendLink.addEventListener('click', function(e) {
        if (!resendLink.classList.contains('active')) {
            e.preventDefault();
            console.log('Link not active, preventing default');
        } else {
            e.preventDefault();
            
            console.log('Link clicked, sending resend request');
            fetch('/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Resend Response : ', data);
                if (data.success) {
                    document.getElementById('verify-btn').disabled = false,
                    Swal.fire({
                        icon: 'success',
                        title: data.message || 'OTP resent successfully',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    seconds = 39;
                    timerElement.textContent = seconds + ' s';
                    resendLink.classList.remove('active');
                    if (countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = setInterval(() => {
                        seconds--;
                        timerElement.textContent = seconds + ' s';
                            if (seconds <= 0) {
                                clearInterval(countdownInterval);
                                countdownInterval = null;
                                document.getElementById('verify-btn').disabled = true,
                                resendLink.classList.add('active');
                            }
                        }, 1000);
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to resend OTP'
                    });
                }
            })
            .catch(error => {
                console.error('Resend OTP error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to resend OTP: ' + (error.message || 'Unknown error')
                });
            });
        }
    });

});