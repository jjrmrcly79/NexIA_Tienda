"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/useCart";

export default function AddToCartButton({
  product,
  disabled,
}: {
  product: { id: string; name: string; price: number };
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={disabled || added}
      className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
        disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : added
          ? "bg-green-500 text-white"
          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
      }`}
    >
      {disabled ? "Sin stock" : added ? "¡Añadido!" : "Añadir al carrito"}
    </button>
  );
}
