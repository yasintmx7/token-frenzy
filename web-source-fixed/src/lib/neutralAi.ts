export interface AiGenerationOptions {
    temperature?: number;
    maxTokens?: number;
}

export interface AiServiceAdapter {
    generateText(prompt: string, options?: AiGenerationOptions): Promise<string>;
}

class NeutralAiService implements AiServiceAdapter {
    private apiKey: string;
    private endpoint: string;

    constructor(config: { apiKey?: string; endpoint?: string } = {}) {
        this.apiKey = config.apiKey || import.meta.env.VITE_AI_SERVICE_KEY || '';
        this.endpoint = config.endpoint || import.meta.env.VITE_AI_SERVICE_ENDPOINT || '';
    }

    async generateText(prompt: string, options?: AiGenerationOptions): Promise<string> {
        if (!this.apiKey) {
            console.warn("NeutralAiService: API key is missing. Returning mock response.");
            return "AI service is not configured.";
        }

        try {
            // This implementation is generic and expects a standard REST API structure.
            // It can be swapped or the endpoint can point to a proxy for any provider.
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    prompt,
                    ...options,
                }),
            });

            if (!response.ok) {
                throw new Error(`AI Service request failed with status: ${response.status}`);
            }

            const data = await response.json();
            // Assumes a generic 'text' or 'content' field in response
            return data.text || data.content || JSON.stringify(data);
        } catch (error) {
            console.error("NeutralAiService Error:", error);
            throw error;
        }
    }
}

export const aiService = new NeutralAiService();
