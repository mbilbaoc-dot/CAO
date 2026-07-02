import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La API Key de Gemini no está configurada.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { miSistema, sistemaRival } = body;

    if (!miSistema || !sistemaRival) {
      return NextResponse.json(
        { error: 'Se requieren el sistema propio y el sistema rival.' },
        { status: 400 }
      );
    }

    const prompt = `Actúas como un Analista Táctico de fútbol de élite mundial. Analiza un enfrentamiento donde mi equipo juega con un sistema ${miSistema} y el equipo rival se planta con un sistema ${sistemaRival}.
Devuélveme un análisis táctico detallado EXACTAMENTE en formato JSON, sin texto de markdown ni comillas fuera del JSON. El JSON debe tener estrictamente esta estructura:
{
  "ventajas": ["punto clave 1", "punto clave 2", "punto clave 3"],
  "desventajas": ["riesgo 1", "riesgo 2", "riesgo 3"],
  "estrategia": "Texto breve con la recomendación clave para ganar el partido."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return NextResponse.json(
        { error: 'Error al comunicarse con la API de Gemini.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Respuesta inválida desde Gemini');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Error parseando la respuesta JSON de Gemini:', resultText);
      return NextResponse.json(
        { error: 'La respuesta de la IA no pudo ser interpretada correctamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error en /api/analizar-tactica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el análisis.' },
      { status: 500 }
    );
  }
}
