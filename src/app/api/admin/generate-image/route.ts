import { NextRequest, NextResponse } from "next/server";

// Genera una imagen de producto usando DALL-E 3 (OpenAI) u otro proveedor.
// Requiere: OPENAI_API_KEY en .env.local
// Alternativamente puede configurarse con otro proveedor de imágenes.
export async function POST(req: NextRequest) {
  const { prompt, productId } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "prompt es requerido" }, { status: 400 });
  }

  if (!productId) {
    return NextResponse.json({ error: "productId es requerido" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY no configurada. Agrega la clave en .env.local para habilitar la generación de imágenes.",
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message ?? "Error de la API de OpenAI");
    }

    const data = await response.json();
    const imageUrl: string = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No se recibió URL de imagen");
    }

    return NextResponse.json({ imageUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al generar imagen" },
      { status: 500 }
    );
  }
}
