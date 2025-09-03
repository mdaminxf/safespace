import { createWorker } from 'tesseract.js';

export async function extractTextFromImageBuffer(buffer: Buffer) {
  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data } = await worker.recognize(buffer);
  await worker.terminate();
  return data.text;
}
