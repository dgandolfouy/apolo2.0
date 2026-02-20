import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("Gemini API Key is missing.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const getStrategicAdvice = async (
    projectContext: string,
    question: string,
    customContext?: string
): Promise<string> => {
    const client = getClient();
    if (!client) return "Error: API Key no configurada.";

    try {
        const prompt = `
      ROL:
      Eres un Project Manager Senior y Consultor Estratégico experto en ejecución y optimización.
      Tu objetivo es dar respuestas breves, extremadamente accionables y directas. No divagues.
      
      CONTEXTO DEL PROYECTO (Datos actuales):
      ${projectContext}

      ${customContext ? `CONTEXTO DE ESTUDIO / DATOS ADICIONALES (Entrenamiento específico del usuario):
      ${customContext}` : ''}

      INSTRUCCIONES:
      1. Estudia el contexto del proyecto y el contexto de estudio (si existe).
      2. Responde a la consulta del usuario de forma profesional y orientada a la acción.
      3. Si el usuario te dio un link o información específica, básate en ella priorizando esos datos.
      
      CONSULTA:
      ${question}
    `;

        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
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
    projectTitle: string
): Promise<string> => {
    const client = getClient();
    if (!client) return "Configura tu API Key para recibir sugerencias.";

    try {
        const prompt = `
      ESTÁS DENTRO DE UNA TAREA ESPECÍFICA.
      Proyecto: ${projectTitle}
      Tarea: ${taskTitle}
      Descripción: ${taskDescription || "Sin descripción"}
      Contexto Adicional (Oculto): ${taskContext || "N/A"}

      OBJETIVO:
      Genera una lista de 3 a 5 "Siguientes Pasos" concretos y accionables para desbloquear o avanzar esta tarea.
      Si hay contexto técnico (ej: medidas, costos), úsalo para ser preciso.
      Formato: Markdown simple (lista con bullets). Sé breve.
    `;

        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        return response.text || "Sin sugerencias por el momento.";
    } catch (error) {
        return "Error al generar sugerencias.";
    }
};
