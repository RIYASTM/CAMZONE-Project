
 function addtoWishlist(productId){
    fetch('/addtowishlist', {
        method : 'POST',
        body : JSON.stringify({productId}),
        headers : {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(data => {
            if(data.success){
                window.location.reload()
            }else{
                Swal.fire('error', data.message || 'Product adding to wish list is failed', 'error')
            }
        })
    }


document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.id
            addToCart(productId)
        })
    })

    function addToCart(productId) {
            const quantity = 1

            if (quantity>0) {
                console.log(quantity)               
                     fetch('/addtocart', {
                        method: "POST",
                        body: JSON.stringify({ productId, quantity }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response=> response.json())
                    .then(data=>{
                    if (data.success) {
                        window.location.reload();
                    } else {
                        Swal.fire('error', data.message || 'Product adding to cart is failed', 'error');
                        // window.location.reload();
                    }
                })
                
                    
                
            }
    }

    document.querySelectorAll('.wishlist-btn').forEach(button => {
        button.addEventListener('click', ()=> {
            const productId = button.dataset.id
            console.log("THIS IS THE WISHLISH BUTTON")
            addtoWishlist(productId)
        })
    })

   

    function deleteFromWishList(productId){
        fetch('/removeFromWishList', {
            method : 'POST',
            body : JSON.stringify({productId}),
            headers : {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
            .then(data => {
                if(data.success){
                    window.location.reload
                }else{
                    Swal.fire('error', data.message || 'Product removing from wish list is failed', 'error')
                }
            })
        }
})