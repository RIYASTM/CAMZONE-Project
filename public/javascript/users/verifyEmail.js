

// Timer functionality

document.addEventListener('DOMContentLoaded', function () {
    const verifyOtpForm = document.getElementById('verifyOtpForm');

    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp').value

        try {
            const response = await fetch('/verify-email', {
                method: 'POST',
                body: JSON.stringify({ otp }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire('Success', data.message || ' successful', 'success')
                    .then(() => {
                        window.location.href = data.redirectUrl || '/';
                    });
            } else {
                console.log('Invalid Otp')
                Swal.fire('Failed', data.message || 'Invalid OTP', 'error')
            }
        } catch (error) {
            console.error('Signup error:', error);
            Swal.fire('Error', 'Something went wrong: ' + error.message, 'error');
        }
    });






    // let seconds = parseInt(timerElement.textContent);
    let timerElement = document.getElementById('timer');
    let resendLink = document.getElementById('resend-link');
    const verifyButton = document.getElementById('verify-btn')
    let remainingTime = document.getElementById('remainig').value / 1000
    let seconds = remainingTime > 0 ? remaining : 0

    timerElement.textContent = seconds + ' s'
    console.log('remaining time : ', remainingTime)
    let countdownInterval = setInterval(() => {

        if (seconds <= 0) {
            clearInterval(countdownInterval);
            verifyButton.disabled = true
            resendLink.classList.add('active');
            return
        }
        seconds--;
        timerElement.textContent = seconds + ' s';
    }, 1000);

    resendLink.addEventListener('click', function (e) {
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
                        let remaining = data.remainingTime ? data.remainingTime / 1000 : 0
                        let remainSeconds = remaining <= 0 ? 0 : remaining
                        timerElement.textContent = remainSeconds + ' s';
                        resendLink.classList.remove('active');
                        if (countdownInterval) {
                            clearInterval(countdownInterval);
                            countdownInterval = setInterval(() => {
                                if (remainSeconds <= 0) {
                                    clearInterval(countdownInterval);
                                    countdownInterval = null;
                                    document.getElementById('verify-btn').disabled = true,
                                        resendLink.classList.add('active');
                                    return
                                }
                                remainSeconds--;
                                timerElement.textContent = remainSeconds + ' s';
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