import { Env } from "../index.js";

export async function provideAISidekick(title: string, blocks: any[], env: Env) {
    if (!env.AI) return null;

    const contentSnippet = blocks
        .filter(b => ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'quote'].includes(b.type))
        .map(b => b.content.rich_text?.map((t: any) => t.plain_text).join('') || '')
        .join('\n')
        .substring(0, 2000);

    const prompt = `
        You are a Senior SEO Strategist for NotionGlaze.
        Analyze the following blog post title and content snippet.
        
        Tasks:
        1. A list of 3-5 relevant and specific tags (comma separated).
        2. A concise, high-impact SEO description (150-160 chars).
        3. A comprehensive summary (max 300 chars).
        4. Expert SEO advice (e.g., 'Risk of duplicate content', 'Good keyword density', 'Needs more internal links').

        Title: ${title}
        Content: ${contentSnippet}

        Return ONLY a JSON object in this format:
        {
          "tags": ["tag1", "tag2"],
          "seoDescription": "...",
          "summary": "...",
          "seoAdvice": "..."
        }
    `;

    try {
        const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
                { role: "system", content: "You are a Senior SEO Strategist that returns structured JSON analysis." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        return response;
    } catch (e) {
        console.error("AI Sidekick Error:", e);
        return null;
    }
}
