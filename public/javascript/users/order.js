document.addEventListener('DOMContentLoaded', () => {

  const search = document.getElementById('search')
  const clearButton = document.getElementById('clear-button')

  search.addEventListener('keypress', async (e) => {

    const searchValue = search.value.trim()

    if (searchValue && e.key === 'Enter') {
      console.log('search : ', searchValue)
      window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
    }
  })

  const closeButton = document.getElementById('retryPaymentClose')
  const retryPaymentButton = document.getElementById('retryPayment') || ''

  if (retryPaymentButton) {
    retryPaymentButton.addEventListener('click', () => openPaymentModal())
  }

  closeButton.addEventListener('click', () => closePaymentModal())

})

let currentOrderId = null;
let modalType = null;

function openModal(type, orderId) {
  currentOrderId = orderId;
  modalType = type;
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const reasonSelect = document.getElementById('reasonSelect');

  // Set modal title and subtitle based on type
  modalTitle.textContent = type === 'return' ? 'Return Order' : 'Cancel Order';
  modalSubtitle.textContent = type === 'return' ? 'Please select items and provide a reason for return' : 'Please select items and provide a reason for cancellation';

  // Populate reason options based on type
  reasonSelect.innerHTML = '<option value="">Choose a reason...</option>';
  const reasons = type === 'cancel' ? [
    'Changed Mind', 'Wrong Item', 'Found Better Price', 'Financial Reason', 'Delivery Delay', 'Other'
  ] : [
    'Defective Item', 'Wrong Size', 'Not As Described', 'Damaged Packaging', 'Quality Issues', 'Missing Parts', 'Other'
  ];
  reasons.forEach(reason => {
    const option = document.createElement('option');
    option.value = reason;
    option.textContent = reason.replace('Other', 'Other (Please Spicify)')
    reasonSelect.appendChild(option);
  });

  // Reset form
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('descriptionText').value = '';
  document.getElementById('errorMessage').style.display = 'none';
  document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('#itemsList input[type="checkbox"]')
  console.log(selectAll)
  selectAll.checked = !selectAll.checked;
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

function toggleItem(element, id) {
  const checkbox = document.getElementById(id);
  checkbox.checked = !checkbox.checked;
  element.classList.toggle('selected');
  const selectAll = document.getElementById('selectAll')
  const checkboxes = Array.from(document.querySelectorAll('#itemsList input[type="checkbox"]'))
  let allSelected = checkboxes.every(cb => cb.checked)
  selectAll.checked = allSelected
}

function confirmAction() {
  const reason = document.getElementById('reasonSelect').value;
  const description = document.getElementById('descriptionText').value;
  const selectedItems = Array.from(document.querySelectorAll('#itemsList input[type="checkbox"]:checked')).map(cb => cb.id.replace('item', ''));


  if (!reason) {
    document.getElementById('errorMessage').textContent = 'Please select a reason.';
    document.getElementById('errorMessage').style.display = 'block';
    return;
  }

  if (selectedItems.length === 0) {
    document.getElementById('errorMessage').textContent = 'Please select at least one item.';
    document.getElementById('errorMessage').style.display = 'block';
    return;
  }

  const url = modalType === 'cancel' ? `/orderCancel` : `/orderReturn`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ reason, description, items: selectedItems, orderId: currentOrderId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showNotification(data.message || `${modalType === 'cancel' ? 'Order cancelled' : 'Return request'} submitted successfully!`, 'success')
        location.reload();
      } else {
        document.getElementById('errorMessage').textContent = data.message || 'Failed to process request.';
        document.getElementById('errorMessage').style.display = 'block';
      }
    });
}

function details(productId) {
  window.location.href = `/product?id=${productId}`
}

function downloadInvoice(orderId) {
  Swal.fire({
    title: 'Generating Invoice...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  })
  fetch(`/downloadInvoice/${orderId}`, {
    method: 'GET',
  })
    .then((response) => {
      if (!response.ok) {
        return showNotification('Failed to download invoice. Try again later', 'error');
      }
      return response.blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Invoice downloaded successfully!', 'success');
    })
    .catch((error) => {
      console.error('Failed to download invoice. Please try again.', error)
      showNotification('Something went wrong. Try again later', 'error');
    });
}

const retryPaymentModal = document.getElementById('retryPaymentModal')

function openPaymentModal() {
  retryPaymentModal.style.display = 'block'
}

function closePaymentModal() {
  retryPaymentModal.style.display = 'none'
}

async function retryPayment(method, orderId, oldMethod) {
  try {
    if (method !== oldMethod) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to change the payment method?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, change it!',
        cancelButtonText: 'No, keep current'
      });
      
      if (!result.isConfirmed) return;
      
      const res = await fetch('/retryPayment', {
        method: 'POST',
        body: JSON.stringify({ method, orderId }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const response = await res.json();

      if (!response.success) {
        showNotification(response.message || 'Failed to repay', 'error');
      } else {
        if (response.message === 'Razorpay Order Created!') {
          const { razorpayOrder, amount, orderId, user } = response;

          console.log("Razorpay")
          if (amount > 100000) {
            await Swal.fire({
              icon: 'warning',
              text: "UPI not available for orders above ₹1,00,000. Please choose Cash on Delevery method.",
              confirmButtonText: 'OK'
            });
          }

          const options = {
            key: 'rzp_test_t9knqvOVCcMCfu',
            amount: amount * 100,
            currency: 'INR',
            name: 'CAMZONE',
            description: 'Order Payment',
            order_id: razorpayOrder.id,
            handler: async function (response) {
              const verifyRes = await fetch('/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: orderId
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                showNotification(verifyData.message || 'Repayment with razorpay is successfull', 'success');
                window.location.reload();
              } else {
                showNotification(verifyData.message || 'Payment verification failed!!', 'error');
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone
            },
            theme: {
              color: '#3399cc'
            }
          };

          const rzp = new Razorpay(options);
          rzp.open();

        } else {
          showNotification(response.message, 'success');
          window.location.reload();
        }
      }
    } else {
      const res = await fetch('/retryPayment', {
        method: 'POST',
        body: JSON.stringify({ orderId, method }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await res.json();

      if (data.success && data.message === 'Successfull') {
        const { razorpayOrder, amount, orderId, user } = data;

        if (amount > 100000) {
          await Swal.fire({
            icon: 'warning',
            text: "UPI not available for orders above ₹1,00,000. Please choose Cash on Delivery method.",
            confirmButtonText: 'OK'
          });
        }


        const options = {
          key: 'rzp_test_t9knqvOVCcMCfu',
          amount: amount * 100,
          currency: 'INR',
          name: 'CAMZONE',
          description: 'Order Payment',
          order_id: razorpayOrder.id,
          handler: async function (response) {
            const verifyRes = await fetch('/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                orderId: orderId
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              showNotification(verifyData.message || 'Repayment with Razorpay is successfull', 'success');
              window.location.reload();
            } else {
              return showNotification(verifyData.message || 'Something went wrong!', 'error');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
          },
          theme: {
            color: '#3399cc'
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();

      } else if (data.success) {
        showNotification(data.message || `Your repayment with ${data.method} successful!!`, 'success');
        window.location.reload()
      } else {
        showNotification(data.message || 'Your repayment failed!!', 'error');
      }
    }

  } catch (error) {
    console.log('Something went wrong with repayment: ', error);
    showNotification('Something went wrong. Try again later..', 'error')
  }
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