import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-placeholder"
});

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CourseStructure {
  title: string;
  modules: Array<{
    title: string;
    lessons: Array<{
      title: string;
      description: string;
      estimatedDuration: number; // minutes
    }>;
  }>;
}

export interface ContentSuggestions {
  improvements: string[];
  missingTopics: string[];
  difficulty: string;
  score: number;
}

export async function generateQuiz(topic: string, level: string = "intermediario"): Promise<QuizQuestion[]> {
  try {
    const prompt = `Crie um quiz de 5 perguntas sobre "${topic}" para nível ${level} em português brasileiro. 
    Responda em formato JSON com o seguinte schema:
    {
      "questions": [
        {
          "question": "pergunta aqui",
          "options": ["opção A", "opção B", "opção C", "opção D"],
          "correctAnswer": 0,
          "explanation": "explicação da resposta correta"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Falha ao gerar quiz com IA");
  }
}

export async function generateCourseStructure(title: string, category: string, level: string): Promise<CourseStructure> {
  try {
    const prompt = `Crie uma estrutura completa de curso para "${title}" na categoria "${category}" para nível ${level}.
    O curso deve ter 3-5 módulos, cada módulo com 3-6 aulas. Responda em português brasileiro.
    Responda em formato JSON com o seguinte schema:
    {
      "title": "título do curso",
      "modules": [
        {
          "title": "nome do módulo",
          "lessons": [
            {
              "title": "título da aula",
              "description": "descrição da aula",
              "estimatedDuration": 30
            }
          ]
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error generating course structure:", error);
    throw new Error("Falha ao gerar estrutura do curso com IA");
  }
}

export async function analyzeContent(content: string): Promise<ContentSuggestions> {
  try {
    const prompt = `Analise o seguinte conteúdo educacional e forneça sugestões de melhoria:
    "${content}"
    
    Responda em português brasileiro no formato JSON:
    {
      "improvements": ["sugestão 1", "sugestão 2"],
      "missingTopics": ["tópico ausente 1", "tópico ausente 2"],
      "difficulty": "iniciante|intermediario|avancado",
      "score": 85
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing content:", error);
    throw new Error("Falha ao analisar conteúdo com IA");
  }
}

export async function generateSummary(content: string): Promise<string> {
  try {
    const prompt = `Crie um resumo conciso e didático do seguinte conteúdo educacional em português brasileiro:
    "${content}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Falha ao gerar resumo com IA");
  }
}

export async function detectInappropriateContent(content: string): Promise<boolean> {
  try {
    const prompt = `Analise se o seguinte conteúdo contém material inadequado para uma plataforma educacional (spam, ofensivo, plágio óbvio, etc.):
    "${content}"
    
    Responda apenas "true" se inadequado ou "false" se apropriado.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0].message.content?.trim().toLowerCase();
    return result === "true";
  } catch (error) {
    console.error("Error detecting inappropriate content:", error);
    return false; // Default to allowing content if AI fails
  }
}
