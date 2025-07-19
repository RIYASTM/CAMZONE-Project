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
        'Changed Mind' , 'Wrong Item' , 'Found Better Price' , 'Financial Reason' , 'Delivery Delay' , 'Other'
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
      let allSelected =  checkboxes.every(cb => cb.checked)
      selectAll.checked = allSelected
    }

    function confirmAction() {
      const reason = document.getElementById('reasonSelect').value;
      const description = document.getElementById('descriptionText').value;
      const selectedItems = Array.from(document.querySelectorAll('#itemsList input[type="checkbox"]:checked')).map(cb => cb.id.replace('item', ''));
      console.log(selectedItems)

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description, items: selectedItems , orderId : currentOrderId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Swal.fire('success', data.message || `${modalType === 'cancel' ? 'Order cancelled' : 'Return request'} submitted successfully!`)
          location.reload();
        } else {
          document.getElementById('errorMessage').textContent = data.message || 'Failed to process request.';
          document.getElementById('errorMessage').style.display = 'block';
        }
      });
    }

    function details(productId){
      window.location.href =`/product?id=${productId}`
    }

    function downloadInvoice(orderId) {
      window.open(`/download-invoice/${orderId}`, '_blank');
    }