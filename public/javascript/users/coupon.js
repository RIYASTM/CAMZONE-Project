
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.copy-btn').forEach(button => {
        const code = button.dataset.code;
        const limit = parseInt(button.dataset.limit);
        const dateUpto = new Date(button.dataset.dateupto)
        const today = new Date();
        let status = button.closest(".coupon-card").querySelector(".status");


        if (dateUpto < today) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-ban"></i> Date Expired';
            button.style.cursor = 'not-allowed';
            status.textContent = 'Non Active'
            return;
        }

        if (limit <= 0) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-ban"></i> Limit Over';
            button.style.cursor = 'not-allowed';
            status.textContent = 'Non Active'
            return;
        }

        button.addEventListener('click', () => {
            copyCouponCode(button, code);
        });
    });

    function copyCouponCode(button, code) {
        navigator.clipboard.writeText(code).then(function () {
            const originalContent = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.classList.add('copied');

            setTimeout(function () {
                button.innerHTML = originalContent;
                button.classList.remove('copied');
            }, 2000);
        }).catch(function (err) {
            console.error('Could not copy text: ', err);
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

    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')

    search.addEventListener('keypress', async (e) => {

        const searchValue = search.value.trim()

        if (searchValue && e.key === 'Enter') {
            console.log('search : ', searchValue)
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })
})