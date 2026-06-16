import { Transaction, Category } from "../types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const GROQ_MODEL = "llama-3.3-70b-versatile"; 
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

const commonFetch = async (url: string, apiKey: string, body: any, providerName: string) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(providerName === 'OpenRouter' ? {
        "HTTP-Referer": window.location.origin,
        "X-Title": "FinSight AI",
      } : {})
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.error || response.statusText || 'Unknown error';
    throw new Error(`${providerName} API error: ${response.status} ${message}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error(`Invalid response from ${providerName}: No choices returned`);
  }
  return data.choices[0].message.content;
};

const callGroq = async (prompt: string, isJson = false) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error("AI_CONFIG_ERROR: Groq API key is missing or invalid");
  }

  return commonFetch("https://api.groq.com/openai/v1/chat/completions", GROQ_API_KEY, {
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: isJson ? { type: "json_object" } : undefined,
    temperature: 0.3,
  }, 'Groq');
};

const callOpenRouter = async (prompt: string, isJson = false) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error("AI_CONFIG_ERROR: OpenRouter API key is missing or invalid");
  }

  return commonFetch("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_API_KEY, {
    model: OPENROUTER_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: isJson ? { type: "json_object" } : undefined,
    temperature: 0.3,
  }, 'OpenRouter');
};

const callGemini = async (prompt: string, isJson = false) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error("AI_CONFIG_ERROR: Gemini API key is missing or invalid");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: isJson ? "application/json" : "text/plain",
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.error || response.statusText || 'Unknown error';
    throw new Error(`Gemini API error: ${response.status} ${message}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

const callAI = async (prompt: string, isJson = false) => {
  // Try providers in order: Groq -> Gemini -> OpenRouter
  try {
    return await callGroq(prompt, isJson);
  } catch (groqError: any) {
    console.warn("Groq failed, trying Gemini...", groqError.message);
    try {
      return await callGemini(prompt, isJson);
    } catch (geminiError: any) {
      console.warn("Gemini failed, trying OpenRouter...", geminiError.message);
      try {
        return await callOpenRouter(prompt, isJson);
      } catch (orError: any) {
        console.error("All AI providers failed");
        throw orError;
      }
    }
  }
};

export const aiService = {
  // Auto-categorize a transaction description
  categorizeTransaction: async (description: string): Promise<Category> => {
    const prompt = `Categorize this financial transaction description into one of these categories: ${Object.values(Category).join(", ")}. 
    Description: "${description}"
    Return the response as a raw string of just the category name. Do not include markdown or punctuation.`;

    try {
      const text = await callAI(prompt);
      const category = text.trim() as Category;
      return Object.values(Category).includes(category) ? category : Category.OTHER;
    } catch (error) {
      return Category.OTHER;
    }
  },

  // Generate spending insights and suggestions
  getFinancialInsights: async (transactions: Transaction[], budgets: any[]): Promise<string[]> => {
    const summary = transactions.slice(0, 20).map(t => `${t.date}: ${t.description} - ${t.amount} (${t.category})`).join("\n");
    const prompt = `Analyze these recent transactions and provide 3 actionable financial tips or observations. 
    Keep them short, professional, and encouraging.
    Transactions:
    ${summary}
    Return the response in JSON format with a key "insights" which is an array of strings. Example:
    { "insights": ["Observation 1", "Observation 2", "Observation 3"] }`;

    try {
      const text = await callAI(prompt, true);
      const data = JSON.parse(text);
      return data.insights || ["Keep tracking your expenses to get personalized insights.", "Consider setting up a budget for better control.", "You're doing great! Keep it up."];
    } catch (error) {
      return ["Keep tracking your expenses to get personalized insights.", "Consider setting up a budget for better control.", "You're doing great! Keep it up."];
    }
  },

  // Chatbot response
  getChatResponse: async (message: string, context: { transactions: Transaction[], balance: number }): Promise<string> => {
    const platformContext = `
    Platform Features (FinSight AI):
    - Net Worth: Calculated as Cash Balance (Income - Expenses) + Portfolio Value.
    - Survival Runway (Stress Test): Days you can survive without income. Calculation: Current Liquidity / Monthly Burn Rate.
    - Financial Health Score: Weighted average of Savings, Spending, Investment, and Emergency Fund scores.
    - Upcoming Bills: Tracking of unpaid bills.
    - Portfolio Tracking: Stocks, Crypto, and Mutual Funds.
    - Smart Budgets: Category-based spending limits.
    `;

    const prompt = `You are FinSight AI, a professional and friendly financial assistant chatbot.

    ${platformContext}
    
    User Context:
    - Current Balance: ${context.balance}
    - Recent Transactions: ${context.transactions.slice(0, 10).map(t => `${t.date}: ${t.description} (${t.amount}) [${t.category}]`).join(", ")}
    
    User Question: "${message}"
    
    If the user asks about the platform, features, or how metrics are calculated, refer to the Platform Features provided above.
    Provide a clear, helpful, actionable, and concise response. Use formatting (bullet points, bold text) where helpful.`;

    return await callAI(prompt);
  },

  // Predict future expenses
  getExpenseForecast: async (transactions: Transaction[]): Promise<{ nextWeek: number, nextMonth: number, reasoning: string }> => {
    const expenses = transactions.filter(t => t.type === 'Expense');
    const summary = expenses.slice(0, 50).map(t => `${t.date}: ${t.amount} (${t.category})`).join("\n");
    
    const prompt = `Based on the following historical expense data, predict the total expenses for the next 7 days (next week) and the next 30 days (next month).
    Provide a brief reasoning for your prediction based on spending patterns, recurring costs, or anomalies.
    
    Historical Expenses:
    ${summary}
    
    Return the response in JSON format with these keys: "nextWeek" (number), "nextMonth" (number), "reasoning" (string).`;

    try {
      const text = await callAI(prompt, true);
      return JSON.parse(text);
    } catch (error) {
      // Fallback calculation
      const avgDaily = expenses.length > 0 
        ? expenses.reduce((sum, t) => sum + t.amount, 0) / (expenses.length * 30) // Very rough estimate
        : 0;
      return {
        nextWeek: avgDaily * 7,
        nextMonth: avgDaily * 30,
        reasoning: "Based on your average daily spending patterns."
      };
    }
  }
};
