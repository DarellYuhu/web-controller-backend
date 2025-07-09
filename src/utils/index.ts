import mime from 'mime';
export const getRandomImgName = (contentType: string) => {
  const random4Digit = Math.floor(1000 + Math.random() * 9000);
  const name = `image-${Date.now()}-${random4Digit}.${mime.getExtension(contentType)}`;
  return name;
};
