import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class TranscriberService {
  private DEFAULT_PROMPT = `Paraphrase the following text into a professionally written news article. Your task is to rewrite all content in your own words to avoid plagiarism. Change the structure and wording as needed for clarity, conciseness, and a formal tone.

Your output must include:

* A concise, informative title
* A brief snippet summarizing the key points
* A full news article in Markdown format, with support for quotes and formatting
* A category, which must be one of: {input_categories}

If the Markdown content includes quotation marks (e.g., direct speech), escape them properly using backslashes (") to maintain valid JSON format. Do not mention or cite any media outlets or source names.

---

Output Format (Give me only a JSON string, without any markdown formatting like triple backticks. I want to use it with JSON.parse() directly.):

{
  "title": "Your news article title here",
  "snippet": "Your concise news summary here",
  "news": "The full news article text here in MD format, with properly escaped quotation marks if any",
  "category": "same as the one above but unly give the id of that categories"
}

Input Text:
{input_text}`;

  async generateWithPrompt(
    transcript: string,
    categories: string,
    template: string = this.DEFAULT_PROMPT,
  ) {
    const prompt = template
      .replace('{input_text}', transcript)
      .replace('{input_categories}', categories);
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.TRANSCRIBE_BASE_URL,
    });
    const response = await client.chat.completions.create({
      model: 'claude-4-sonnet-20250514',
      messages: [{ role: 'user', content: prompt }],
    });

    const data = response.choices[0].message.content;
    if (!data) {
      throw new Error('Fail generate content');
    }
    const parsed = JSON.parse(data) as GeneratedArticle;
    return parsed;
  }
}
