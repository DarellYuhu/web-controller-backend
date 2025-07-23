import { sample } from 'lodash';
import mime from 'mime';
import slugCore from 'slugify';
export const getRandomImgName = (contentType: string) => {
  const random4Digit = Math.floor(1000 + Math.random() * 9000);
  const name = `image-${Date.now()}-${random4Digit}.${mime.getExtension(contentType)}`;
  return name;
};

export const slugify = (text: string) => {
  return slugCore(text, { lower: true, strict: true });
};

export function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) sample(items);
  const r = Math.random() * total;
  let acc = 0;

  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r < acc) return items[i];
  }

  throw new Error('Should not reach here');
}
