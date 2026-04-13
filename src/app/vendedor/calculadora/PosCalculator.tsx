"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface PosProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface TicketItem {
  product: PosProduct;
  quantity: number;
}

export default function PosCalculator({
  products,
  tenantId,
}: {
  products: PosProduct[];
  tenantId: string;
}) {
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchProd, setSearchProd] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchProd.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProd.toLowerCase());
    const matchCat = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const total = ticket.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  function addToTicket(product: PosProduct) {
    setTicket((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function setQuantity(productId: string, qty: number) {
    if (qty < 1) {
      setTicket((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setTicket((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      )
    );
  }

  function removeFromTicket(productId: string) {
    setTicket((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function limpiarTicket() {
    setTicket([]);
    setCustomerName("");
    setNotes("");
  }

  async function registrarVenta() {
    if (ticket.length === 0) return;
    setSaving(true);

    const supabase = createClient();

    const { data: session, error } = await supabase
      .schema("nexia_tienda")
      .from("sale_sessions")
      .insert({
        tenant_id: tenantId,
        customer_name: customerName || null,
        notes: notes || null,
        total,
      })
      .select("id")
      .single();

    if (error || !session) {
      setSaving(false);
      alert("Error al registrar la venta. Intenta de nuevo.");
      return;
    }

    await supabase
      .schema("nexia_tienda")
      .from("sale_session_items")
      .insert(
        ticket.map((item) => ({
          session_id: session.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
        }))
      );

    setSaving(false);
    setSuccess(true);
    limpiarTicket();
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo — Productos */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchProd}
            onChange={(e) => setSearchProd(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro categorías */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !selectedCategory
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const inTicket = ticket.find((i) => i.product.id === product.id);
            return (
              <button
                key={product.id}
                onClick={() => addToTicket(product)}
                className={`relative text-left border rounded-xl overflow-hidden transition-all hover:shadow-md active:scale-95 ${
                  inTicket
                    ? "border-blue-400 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="aspect-square bg-gray-100 relative">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">
                      📦
                    </div>
                  )}
                  {inTicket && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {inTicket.quantity}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 line-clamp-1">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    ${Number(product.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel derecho — Ticket */}
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-xl flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Ticket</h2>
          </div>

          {ticket.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12">
              Selecciona productos del panel izquierdo
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {ticket.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      ${Number(item.product.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })} c/u
                    </p>
                  </div>
                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ${(item.product.price * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromTicket(item.product.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {ticket.reduce((s, i) => s + i.quantity, 0)} artículo{ticket.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <input
              type="text"
              placeholder="Nombre del cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-2">
              <button
                onClick={limpiarTicket}
                disabled={ticket.length === 0}
                className="flex-shrink-0 border border-gray-300 text-gray-600 text-sm px-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={registrarVenta}
                disabled={ticket.length === 0 || saving}
                className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${
                  success
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                }`}
              >
                {saving ? "Registrando..." : success ? "¡Venta registrada!" : "Registrar Venta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
