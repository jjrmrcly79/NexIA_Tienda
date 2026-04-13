"use client";

import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const STORAGE_KEY = "nexia_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const addItem = useCallback(
    (product: { id: string; name: string; price: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        const next = existing
          ? prev.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...prev, { ...product, quantity: 1 }];
        saveCart(next);
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, quantity } : i));
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, total };
}
