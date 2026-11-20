import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('atelier_cart');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('atelier_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variantId, selectedSize = null, selectedColor = null, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product_id === product.id && item.variant_id === variantId
      );
      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, {
          product_id: product.id, variant_id: variantId, name: product.name,
          price_cad: product.price_cad, image_url: product.image_url,
          category: product.category, size: selectedSize, color: selectedColor, quantity
        }];
      }
    });
  };

  const removeFromCart = (variantId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.variant_id !== variantId));
  };

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity <= 0) { removeFromCart(variantId); return; }
    setCartItems((prevItems) => prevItems.map((item) =>
      item.variant_id === variantId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => setCartItems([]);
  const getItemsCount = () => cartItems.reduce((total, item) => total + item.quantity, 0);
  const getSubtotal = () => cartItems.reduce((total, item) => total + item.price_cad * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getItemsCount, getSubtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
