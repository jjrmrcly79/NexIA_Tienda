"use client";

import { useCart } from "@/lib/cart/useCart";
import Link from "next/link";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/tienda" className="text-lg font-bold text-gray-900">
            NexIA Tienda
          </Link>
          <Link href="/tienda" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Ver catálogo
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Carrito</h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-gray-500 mb-6">Tu carrito está vacío.</p>
            <Link href="/tienda" className="text-blue-600 hover:underline text-sm font-medium">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border border-gray-200 rounded-xl p-4"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      ${item.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold text-gray-900 w-20 text-right">
                    ${(item.price * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                disabled
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl opacity-50 cursor-not-allowed text-sm"
              >
                Pagar (próximamente con Stripe)
              </button>
              <button
                onClick={clearCart}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
