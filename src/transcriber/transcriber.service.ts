import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class TranscriberService {
  private DEFAULT_PROMPT = `Paraphrase the following text into a professionally written news article. Your task is to rewrite all content in your own words to avoid plagiarism. Change the structure and wording as needed for clarity, conciseness, and a formal tone.`;

  private PROMPT_TEMPLATE = `
{input_prompt}

Your output must include:

* A concise, informative title
* A brief snippet summarizing the key points
* A full news article in Markdown format, with support for quotes and formatting
* A category, which must be one of: {input_categories}
* A prompt for search the image related to the generated article. Make it short and clear in a single sentance.

If the Markdown content includes quotation marks (e.g., direct speech), escape them properly using backslashes (") to maintain valid JSON format. Do not mention or cite any media outlets or source names.

---

Output Format (Give me only a JSON string, without any markdown formatting like triple backticks. I want to use it with JSON.parse() directly.):

{
  "title": "Your news article title here",
  "snippet": "Your concise news summary here",
  "news": "The full news article text here in MD format, with properly escaped quotation marks if any. Don't include the title in this field",
  "category": "same as the one above but unly give the id of that categories"
  "imgPrompt": "The image prompt"
}

Input Text:
{input_text}`;

  async generateWithPrompt(
    transcript: string,
    categories: string,
    prompt: string = this.DEFAULT_PROMPT,
  ) {
    let content = this.PROMPT_TEMPLATE.replace('{input_text}', transcript)
      .replace('{input_categories}', categories)
      .replace('{input_prompt}', this.DEFAULT_PROMPT);
    if (prompt) content = content.replace('{input_prompt}', prompt);
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.TRANSCRIBE_BASE_URL,
    });
    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content }],
    });

    const data = response.choices[0].message.content;
    if (!data) {
      throw new Error('Fail generate content');
    }
    const parsed = JSON.parse(data) as GeneratedArticle;
    return parsed;
  }
}
