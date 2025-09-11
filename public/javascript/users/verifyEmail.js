

// Timer functionality

document.addEventListener('DOMContentLoaded', function () {
    const verifyOtpForm = document.getElementById('verifyOtpForm');

    let inputValue = document.getElementById('remaining').value
    // force it to be a number
    let ms = parseInt(inputValue, 10) || 0;  

    let remaining = Math.ceil(ms / 1000);

    let remainSecond = remaining > 0 ? remaining : 0;
    
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
                window.location.href = data.redirectUrl || '/';
            } else {
                if (remaining <= 0) {
                    console.log('OTP expired : ', remaining);
                    showNotification(data.message || 'OTP expired, please request a new one', 'error');
                } else {
                    console.log('Invalid OTP, seconds left:', remainSecond);
                    showNotification('Invalid OTP', 'error');
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            showNotification(`Something went wrong : ${error.message}`, 'error')
        }
    });
    
    let timerElement = document.getElementById('timer');
    let resendLink = document.getElementById('resend-link');
    const verifyButton = document.getElementById('verify-btn')
    let remainingTime = Math.ceil(document.getElementById('remaining').value / 1000)
    let seconds = remainingTime > 0 ? remainingTime : 0
    
    
    
    console.log('remaining time : ', remainingTime)
    let countdownInterval = setInterval(() => {
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            verifyButton.disabled = true
            resendLink.classList.add('active');
            return
        }
        seconds--;

        const minute = Math.floor(seconds / 60)
        let second = seconds % 60
        timerElement.textContent = `${String(minute).padStart(2, '0')} : ${String(second).padStart(2, '0')} mins`
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
                        showNotification('OTP Resend successfully', 'success')
                        let remainingTime = data.remainingTime ? data.remainingTime / 1000 : 0
                        let remainSeconds = remainingTime <= 0 ? 0 : remainingTime
                        remaining = remainingTime
                        remainSecond = remaining > 0 ? remaining : 0;
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
                                const minute = Math.floor(remainSeconds / 60)
                                const second = remainSeconds % 60

                                timerElement.textContent = `${String(minute).padStart(2, '0')} : ${String(second).padStart(2, '0')} mins`
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
