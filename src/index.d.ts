type ArticleMetadata = {
  id: number;
  date: string;
  link: stirng;
  title: string;
  domain: string;
  subdomain: string;
};

type ParsedArticle = {
  id: number;
  date: string;
  title: string;
  content: string;
};

type GeneratedArticle = {
  title: string;
  snippet: string;
  news: string;
  category: string;
  imgPrompt: string;
};

type AddImagePayload = {
  name: string;
  path: string;
  bucket: string;
  contentType: string;
  buffer: Buffer;
};
