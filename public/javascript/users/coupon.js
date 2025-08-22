
document.querySelectorAll('.copy-btn').forEach(button => {
    const code = button.dataset.code;
    const limit = parseInt(button.dataset.limit);
    const dateUpto = new Date(button.dataset.dateUpto);
    const today = new Date();

    if (dateUpto < today) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-ban"></i> Date Expired';
        button.style.cursor = 'not-allowed';
        return;
    }

    if (limit <= 0) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-ban"></i> Limit Over';
        button.style.cursor = 'not-allowed';
        return;
    }

    button.addEventListener('click', () => {
        copyCouponCode(button, code);
    });
});


function copyCouponCode(button, code) {
    // Copy to clipboard
    navigator.clipboard.writeText(code).then(function () {
        // Change button text and style
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');

        // Reset after 2 seconds
        setTimeout(function () {
            button.innerHTML = originalContent;
            button.classList.remove('copied');
        }, 2000);
    }).catch(function (err) {
        console.error('Could not copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.classList.add('copied');
            setTimeout(function () {
                button.innerHTML = '<i class="fas fa-copy"></i> Copy';
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Fallback: Could not copy text: ', err);
        }
        document.body.removeChild(textArea);
    });
}

function toggleCouponCode(index) {
    const codeElement = document.getElementById(`coupon-${index}`);
    const button = event.target.closest('.show-btn');

    if (codeElement.classList.contains('hidden')) {
        codeElement.classList.remove('hidden');
        button.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
    } else {
        codeElement.classList.add('hidden');
        button.innerHTML = '<i class="fas fa-eye"></i> Show';
    }
}