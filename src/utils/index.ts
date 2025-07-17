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
