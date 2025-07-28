const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Brands = require('../../model/brandModel')
const Category = require('../../model/categoryModel')
const Cart = require('../../model/cartModel')
const WishList = require('../../model/wishlistModel')

const {calculateDiscountedPrice} = require('../../helpers/productOffer')



const loadCart = async (req, res) => {
    try {
        const search = req.query.search || '';
        const userId = req.session.user;

        const user = await User.findById(userId);
        const cart = await Cart.findOne({ userId });

        let cartItems = [];
        let subTotal = 0;
        let totalOfferPrice = 0;
        let totalOfferedPrice = 0;

        if (cart && cart.items.length > 0) {
            cartItems = cart.items.filter(item => !item.isDeleted);

            for (let item of cartItems) {
                const product = await Products.findOne({ _id: item.productId, isBlocked: false })
                    .populate('category')
                    .populate('brand');

                if (product) {
                    item.productId = product;

                    const { discountedPrice, totalOffer } = calculateDiscountedPrice(product);

                    item.itemPrice = product.regularPrice;
                    item.discount = totalOffer;
                    item.price = discountedPrice;
                    item.totalPrice = discountedPrice * item.quantity;

                    item.productGst = product.gst || Math.round(product.regularPrice * 0.18);
                    subTotal += item.totalPrice;
                } else {
                    item.productId = null;
                }
            }

            cartItems = cartItems.filter(item => item.productId !== null);

            cart.totalAmount = cartItems.reduce((total, item) => total + item.totalPrice, 0);
            cart.GST = cartItems.reduce((total, item) => total + (item.productGst || 0) * item.quantity, 0);

            await cart.save();

            // Offer calculations
            totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
            totalOfferedPrice = totalOfferPrice - cart.totalAmount;
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

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not Authenticated!!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!!' });
        }

        const { productId, quantity } = req.body;
        const parsedQuantity = parseInt(quantity);

        const wishList = await WishList.findOne({ user: userId }).populate('items.product');
        if (wishList) {
            const wishlistItem = wishList.items.find(
                item => item.product._id.toString() === productId.toString()
            );
            if (wishlistItem) {
                await WishList.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
            }
        }

        const product = await Products.findOne({
            _id: productId,
            isDeleted: false,
            isBlocked: false
        }).populate('category').populate('brand');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found!!' });
        }

        const stock = product.quantity;

        // Offer calculation
        const productOffer = product.productOffer || 0;
        const categoryOffer = product.category?.categoryOffer || 0;
        const brandOffer = product.brand?.brandOffer || 0;
        const totalOffer = productOffer + categoryOffer + brandOffer;

        const discountedPrice = Math.round(product.regularPrice * (1 - totalOffer / 100));
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
        if (totalQuantity > stock) {
            return res.status(401).json({ success: false, message: 'Quantity exceeded available stock' });
        }

        if (existingItem) {
            existingItem.quantity += parsedQuantity;
            existingItem.discount = totalOffer;
            existingItem.itemPrice = product.regularPrice;
            existingItem.price = discountedPrice;
            existingItem.totalPrice = discountedPrice * existingItem.quantity;
            existingItem.productGst = +(product.gst * existingItem.quantity).toFixed(2);
        } else {
            cartDoc.items.push(newCartItem);
        }

        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);
        cartDoc.GST = +cartDoc.items.reduce((sum, item) => sum + item.productGst, 0).toFixed(2);

        const savedCart = await cartDoc.save();

        if (!savedCart) {
            return res.status(401).json({ success: false, message: 'Product adding failed' });
        }

        return res.status(200).json({
            success: true,
            message: "Product added successfully",
            redirectUrl: '/cart',
            cartCount: cartDoc.items.length
        });

    } catch (error) {
        console.error('Failed to add to the cart:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while adding to the cart!!' });
    }
};

const cartUpdate = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not Authenticated!!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!!' });
        }

        const { productId, quantity } = req.body;
        const parsedQuantity = parseInt(quantity);
        console.log('Requested Quantity:', parsedQuantity);

        const product = await Products.findOne({
            _id: productId,
            isDeleted: false,
            isBlocked: false
        }).populate('category').populate('brand');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found!!' });
        }

        const stock = product.quantity;
        if (parsedQuantity > stock) {
            return res.status(401).json({ success: false, message: `Quantity exceeded available stock of ${product.productName}` });
        } else if (parsedQuantity > 4) {
            return res.status(401).json({ success: false, message: 'Maximum quantity is 4!!' });
        }

        let cartDoc = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartDoc) {
            return res.status(404).json({ success: false, message: 'Cart not found for the user' });
        }

        const existItem = cartDoc.items.find(item =>
            item.productId._id.toString() === product._id.toString()
        );

        if (!existItem) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Discount calculation
        const productOffer = product.productOffer || 0;
        const categoryOffer = product.category?.categoryOffer || 0;
        const brandOffer = product.brand?.brandOffer || 0;
        const totalOffer = productOffer + categoryOffer + brandOffer;

        const discountedPrice = Math.round(product.regularPrice * (1 - totalOffer / 100));
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
            return res.status(401).json({ success: false, message: 'Cart update failed!' });
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

        return res.status(200).json({ success: true, message: "Product updated successfully", values });

    } catch (error) {
        console.error('Failed to update cart:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while updating the cart!' });
    }
};

const removeItem = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        const { productId } = req.body;

        const product = await Products.findOne({ _id: productId, isDeleted: false, isBlocked: false });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        const cartDoc = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartDoc) {
            return res.status(404).json({ success: false, message: 'Cart not found!' });
        }

        const itemIndex = cartDoc.items.findIndex(item => item.productId._id.toString() === productId);
        if (itemIndex === -1) {
            return res.status(400).json({ success: false, message: 'Item not found in cart!' });
        }

        cartDoc.items.splice(itemIndex, 1);

        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);

        cartDoc.GST = cartDoc.items.reduce((total, item) => {
            const gst = item.productId.gst || 0;
            return total + (gst * item.quantity);
        }, 0);

        const updatedCart = await cartDoc.save();
        if (!updatedCart) {
            return res.status(500).json({ success: false, message: 'Failed to update cart after deletion!' });
        }

        return res.status(200).json({ success: true, message: 'Product removed successfully from cart!' });

    } catch (error) {
        console.error('Error while removing item from cart:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while deleting item from cart!' });
    }
};



module.exports = {
    loadCart,
    addToCart,
    cartUpdate,
    removeItem,
}