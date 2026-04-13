import { NextRequest, NextResponse } from "next/server";

// Genera un brand kit usando la API de Claude (Anthropic)
// Requiere: ANTHROPIC_API_KEY en .env.local
export async function POST(req: NextRequest) {
  const { tenantName, giro, publico } = await req.json();

  if (!tenantName || !giro) {
    return NextResponse.json({ error: "tenantName y giro son requeridos" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada. Agrega la clave en .env.local" },
      { status: 503 }
    );
  }

  const systemPrompt = `Eres un experto en branding y diseño de identidad visual para marcas de negocios mexicanos.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown.`;

  const userPrompt = `Crea un brand kit completo para el siguiente negocio:
- Nombre: ${tenantName}
- Giro: ${giro}
${publico ? `- Público objetivo: ${publico}` : ""}

Responde con este JSON exacto (todos los campos son obligatorios):
{
  "nombre": "nombre comercial sugerido",
  "slogan": "slogan memorable",
  "descripcion": "descripción de la marca en 2-3 oraciones",
  "tono": "descripción del tono de voz (formal/informal, cálido/técnico, etc.)",
  "valores": ["valor1", "valor2", "valor3", "valor4"],
  "colores": [
    { "nombre": "Color primario", "hex": "#XXXXXX", "uso": "para qué usarlo" },
    { "nombre": "Color secundario", "hex": "#XXXXXX", "uso": "para qué usarlo" },
    { "nombre": "Color acento", "hex": "#XXXXXX", "uso": "para qué usarlo" },
    { "nombre": "Fondo", "hex": "#XXXXXX", "uso": "para qué usarlo" }
  ],
  "tipografias": [
    { "nombre": "nombre de fuente Google Fonts", "uso": "títulos y encabezados" },
    { "nombre": "nombre de fuente Google Fonts", "uso": "cuerpo de texto" }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message ?? "Error de la API de Claude");
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    // Parsear el JSON de la respuesta
    const brandKit = JSON.parse(text);

    return NextResponse.json({ brandKit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al generar branding" },
      { status: 500 }
    );
  }
}
