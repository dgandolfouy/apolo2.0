import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("Gemini API Key is missing.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export interface AIMediaPart {
    mimeType: string;
    data: string;
    name: string;
}

export const getStrategicAdvice = async (
    projectContext: string,
    question: string,
    customContext?: string,
    mediaParts?: AIMediaPart[]
): Promise<string> => {
    const client = getClient();
    if (!client) return "Error: API Key no configurada.";

    try {
        const promptText = `
      ROL:
      Eres un Project Manager Senior y Consultor Estratégico experto en ejecución y optimización.
      Tu objetivo es dar respuestas breves, extremadamente accionables y directas. No divagues.
      
      CONTEXTO DEL PROYECTO (Datos actuales):
      ${projectContext}

      ${customContext ? `CONTEXTO DE ESTUDIO / DATOS ADICIONALES (Entrenamiento específico del usuario):
      ${customContext}` : ''}

      INSTRUCCIONES:
      1. Estudia el contexto del proyecto, el contexto de estudio y cualquier archivo/imagen adjunto.
      2. Responde a la consulta del usuario de forma profesional y orientada a la acción.
      3. Si el usuario te dio un link o información específica, básate en ella priorizando esos datos.
      
      CONSULTA:
      ${question}
    `;

        const parts: any[] = [{ text: promptText }];

        if (mediaParts && mediaParts.length > 0) {
            mediaParts.forEach(part => {
                // Ensure base64 is clean (no prefix)
                const base64Data = part.data.includes('base64,') ? part.data.split('base64,')[1] : part.data;
                parts.push({
                    inlineData: {
                        mimeType: part.mimeType,
                        data: base64Data
                    }
                });
            });
        }

        const response = await (client as any).models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: 'user',
                parts: parts
            }]
        });

        return response.text || "No se pudo generar un consejo.";
    } catch (error) {
        console.error("Error fetching advice:", error);
        return "Ocurrió un error al consultar al asesor virtual.";
    }
};

export const generateTaskSuggestions = async (
    taskTitle: string,
    taskDescription: string,
    taskContext: string,
    projectTitle: string,
    mediaParts?: AIMediaPart[]
): Promise<string> => {
    const client = getClient();
    if (!client) return "Configura tu API Key para recibir sugerencias.";

    try {
        const promptText = `
      ESTÁS DENTRO DE UNA TAREA ESPECÍFICA.
      Proyecto: ${projectTitle}
      Tarea: ${taskTitle}
      Descripción: ${taskDescription || "Sin descripción"}
      Contexto Adicional (Oculto): ${taskContext || "N/A"}

      OBJETIVO:
      Genera una lista de 3 a 5 "Siguientes Pasos" concretos y accionables para desbloquear o avanzar esta tarea.
      Si hay contexto técnico (ej: medidas, costos) o archivos adjuntos (imágenes/PDFs), úsalos para ser preciso.
      Formato: Markdown simple (lista con bullets). Sé breve.
    `;

        const parts: any[] = [{ text: promptText }];

        if (mediaParts && mediaParts.length > 0) {
            mediaParts.forEach(part => {
                const base64Data = part.data.includes('base64,') ? part.data.split('base64,')[1] : part.data;
                parts.push({
                    inlineData: {
                        mimeType: part.mimeType,
                        data: base64Data
                    }
                });
            });
        }

        const response = await (client as any).models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: 'user',
                parts: parts
            }]
        });

        return response.text || "Sin sugerencias por el momento.";
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return "Error al generar sugerencias.";
    }
};
