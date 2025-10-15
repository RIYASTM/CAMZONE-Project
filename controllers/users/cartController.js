const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const WishList = require('../../model/wishlistModel')
const Product = require('../../model/productModel')

const { calculateDiscountedPrice, cartPrices } = require('../../helpers/productOffer');
const { handleStatus } = require('../../helpers/status');


const loadCart = async (req, res) => {
    try {
        const search = req.query.search || '';
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return handleStatus(res, 404, 'User not found!!', { redirectUrl: '/signin' })
        }
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        let cartItems = [];
        let subTotal = 0;
        let totalOfferPrice = 0;
        let totalOfferedPrice = 0;

        if (cart && cart.items.length > 0) {
            ({ cartItems, subTotal, totalOfferPrice, totalOfferedPrice } = await cartPrices(cart))
        }

        return res.render('cart', {
            user,
            currentPage: 'cart',
            cartItems,
            search,
            subtotal: subTotal,
            total: subTotal,
            cart,
            totalOfferedPrice
        });

    } catch (error) {
        console.log('Failed to load the cart page:', error);
        return res.redirect('/pageNotFound');
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return handleStatus(res, 404, 'User not found!!');
        }

        const { productId, quantity } = req.body;
        const parsedQuantity = parseInt(quantity);

        const wishList = await WishList.findOne({ userId }).populate('items.product');
        if (wishList) {
            const wishlistItem = wishList.items.find(
                item => item.product._id.toString() === productId.toString()
            );
            if (wishlistItem) {
                await WishList.updateOne({ userId }, { $pull: { items: { product: productId } } });
            }
        }

        const product = await Products.findOne({
            _id: productId,
            isDeleted: false,
            isBlocked: false
        }).populate('category').populate('brand');

        if (!product) {
            return handleStatus(res, 404, 'Product not found!!');
        }

        if (product.status !== 'Available') {
            return handleStatus(res, 400, 'This item is not available!!', { productId })
        }

        const stock = product.quantity;

        const { discountedPrice, totalOffer } = calculateDiscountedPrice(product)
        const gstValue = +(product.gst * parsedQuantity).toFixed(2);

        const newCartItem = {
            productId: product._id,
            quantity: parsedQuantity,
            discount: totalOffer,
            itemPrice: product.regularPrice,
            price: discountedPrice,
            totalPrice: discountedPrice * parsedQuantity,
            status: product.status,
            productGst: gstValue
        };

        let cartDoc = await Cart.findOne({ userId });
        if (!cartDoc) {
            cartDoc = new Cart({ userId, items: [newCartItem] });
        }

        const existingItem = cartDoc.items.find(item =>
            item.productId?.toString() === productId.toString()
        );

        const totalQuantity = existingItem ? existingItem.quantity + parsedQuantity : parsedQuantity;

        if ((existingItem?.quantity || totalQuantity || parsedQuantity) > 15) {
            return handleStatus(res, 401, 'Max 15 count is allowed at an order!')
        }

        if (totalQuantity > stock) {
            return handleStatus(res, 401, 'Quantity exceeded over stock!!')
        }

        if (existingItem) {
            existingItem.quantity += parsedQuantity;
            existingItem.discount = totalOffer;
            existingItem.itemPrice = product.regularPrice;
            existingItem.price = discountedPrice;
            existingItem.totalPrice = discountedPrice * existingItem.quantity;
            existingItem.productGst = +(product.gst * existingItem.quantity).toFixed(2);
        } else {
            if (cartDoc.items.length < 6) {
                cartDoc.items.push(newCartItem);
            } else {
                return handleStatus(res, 401, 'You can save max 6 items in your cart!!');
            }
        }

        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);
        cartDoc.GST = +cartDoc.items.reduce((sum, item) => sum + item.productGst, 0).toFixed(2);

        const savedCart = await cartDoc.save();

        if (!savedCart) {
            return handleStatus(res, 500, 'Product adding failed!!');
        }

        return handleStatus(res, 200, 'Product added successfully!', {
            redirectUrl: '/cart',
            cartCount: cartDoc.items.length
        });

    } catch (error) {
        console.error('Failed to add to the cart:', error);
        return handleStatus(res, 500);
    }
};

const cartUpdate = async (req, res) => {
    try {
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return handleStatus(res, 402, 'User not found!!');
        }

        const { productId, quantity } = req.body;
        const parsedQuantity = parseInt(quantity);

        const product = await Products.findOne({
            _id: productId,
            isDeleted: false,
            isBlocked: false
        }).populate('category').populate('brand');
        if (!product) {
            return handleStatus(res, 400, 'Product not found!!');
        }

        const stock = product.quantity;
        if (parsedQuantity > stock) {
            return handleStatus(res, 400, `Quantity exeeded over available stock of ${product.productName}!!`)
        } else if (parsedQuantity > 15) {
            return handleStatus(res, 400, 'Maximum quantity is 15!!')
        }

        let cartDoc = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartDoc) {
            return handleStatus(res, 404, 'Your cart is not found!!')
        }

        const existItem = cartDoc.items.find(item =>
            item.productId._id.toString() === product._id.toString()
        );

        if (!existItem) {
            return handleStatus(res, 404, 'Item not found in your cart!!')
        }

        const { discountedPrice, totalOffer } = calculateDiscountedPrice(product)
        const gstValue = +(product.gst * parsedQuantity).toFixed(2);

        existItem.quantity = parsedQuantity;
        existItem.discount = totalOffer;
        existItem.itemPrice = product.regularPrice;
        existItem.price = discountedPrice;
        existItem.totalPrice = discountedPrice * parsedQuantity;
        existItem.productGst = gstValue;

        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);
        cartDoc.GST = +cartDoc.items.reduce((sum, item) => {
            const gst = item.productId?.gst || 0;
            return sum + gst * item.quantity;
        }, 0).toFixed(2);

        const saveCart = await cartDoc.save();
        if (!saveCart) {
            return handleStatus(res, 500, 'Cart update failed!!')
        }

        const itemSubTotal = existItem.totalPrice;
        const subtotal = cartDoc.totalAmount;
        const totalBeforeDiscount = cartDoc.items.reduce((total, item) => total + item.itemPrice * item.quantity, 0);
        const discountAmount = totalBeforeDiscount - subtotal;

        const values = {
            itemSubTotal,
            subtotal,
            cartTotal: subtotal,
            discountAmount
        };

        return handleStatus(res, 200, 'Product updated successfully', { values })

    } catch (error) {
        console.error('Failed to update cart:', error);
        return handleStatus(res, 500);
    }
};

const removeItem = async (req, res) => {
    try {

        const userId = req.session.user;
        const { productId } = req.body;

        const [user, product, cartDoc] = await Promise.all([
            User.findById(userId),
            Product.findOne({ _id: productId, isDeleted: false, isBlocked: false }),
            Cart.findOne({ userId }).populate('items.productId')
        ])

        if (!user) {
            return handleStatus(res, 404, 'User not found!!')
        }

        if (!product) {
            return handleStatus(res, 404, 'Product not found!!')
        }

        if (!cartDoc) {
            return handleStatus(res, 404, 'Cart not found!!')
        }

        const itemIndex = cartDoc.items.findIndex(item => item.productId._id.toString() === productId);
        if (itemIndex === -1) {
            return handleStatus(res, 401, 'Item not found in your cart!!')
        }

        cartDoc.items.splice(itemIndex, 1);

        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);

        cartDoc.GST = cartDoc.items.reduce((total, item) => {
            const gst = item.productId.gst || 0;
            return total + (gst * item.quantity);
        }, 0);

        const updatedCart = await cartDoc.save();
        if (!updatedCart) {
            return handleStatus(res, 500, 'Failed to update cart after deletion!')
        }

        let cartItems = [];
        let subTotal = 0;
        let cartTotal = 0
        let totalOfferPrice = 0;
        let totalOfferedPrice = 0;

        if (cartDoc && cartDoc.items.length > 0) {
            ({ cartItems, subTotal, totalOfferPrice, totalOfferedPrice, cartTotal } = await cartPrices(cartDoc))
        }

        return handleStatus(res, 200, 'Product remvoed successfully from your cart!', {
            cartItems,
            subTotal,
            totalOfferedPrice,
            cartTotal,
            cartCount: cartDoc.items.length
        });

    } catch (error) {
        console.error('Error while removing item from cart:', error);
        return handleStatus(res, 500)
    }
};

const cartToWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.body.productId;

        const product = await Products.findOne({ _id: productId, isDeleted: false, isBlocked: false });
        if (!product) {
            return handleStatus(res, 404, 'Product not found!')
        }

        const cartDoc = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartDoc) {
            return handleStatus(res, 404, 'Cart not found!!')
        }

        const itemIndex = cartDoc.items.findIndex(item => item.productId._id.toString() === productId);
        if (itemIndex === -1) {
            return handleStatus(res, 400, 'Item not found in cart!!')
        }

        cartDoc.items.splice(itemIndex, 1);

        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);
        cartDoc.GST = cartDoc.items.reduce((total, item) => {
            const gst = item.productId.gst || 0;
            return total + (gst * item.quantity);
        }, 0);

        await cartDoc.save();

        let wishlist = await WishList.findOne({ userId }).populate('items.product');

        if (!wishlist) {
            wishlist = new WishList({
                userId,
                items: [{ product: product._id }]
            });
        } else {
            const alreadyExist = wishlist.items.some(i => i.product._id.toString() === productId);
            if (!alreadyExist) {
                wishlist.items.push({ product: product._id });
            }
        }

        await wishlist.save();

        let cartItems = [];
        let subTotal = 0;
        let cartTotal = 0
        let totalOfferPrice = 0;
        let totalOfferedPrice = 0;

        if (cartDoc && cartDoc.items.length > 0) {
            ({ cartItems, subTotal, totalOfferPrice, totalOfferedPrice, cartTotal } = await cartPrices(cartDoc))
        }

        return handleStatus(res, 200, 'Product successfully moved to your Wish List', {
            cartItems,
            subTotal,
            totalOfferedPrice,
            cartTotal,
            cartCount: cartDoc.items.length
        });

    } catch (error) {
        console.log("Something went wrong when moving to wishlist: ", error);
        return handleStatus(res, 500)
    }
};

const toCheckout = async (req, res) => {
    try {

        const userId = req.session.user
        const cart = await Cart.findOne({ userId }).populate('items.productId')

        const cartItems = cart.items
        if (cartItems.length < 1) {
            return handleStatus(res, 400, 'Your cart is empty!!')
        }

        for (let item of cartItems) {
            if (item.quantity < 1) {
                return handleStatus(res, 401, 'One of item is Not available!!', { productId: item.productId._id })
            }
        }

        return handleStatus(res, 200, null, { redirectUrl: '/checkout' });

    } catch (error) {
        console.log('Something went wrong while proceeding to checkout...', error)
        return handleStatus(res, 500)
    }
};


module.exports = {
    loadCart,
    addToCart,
    toCheckout,
    cartUpdate,
    removeItem,
    cartToWishlist,
}