import { readFileSync, lstatSync } from 'node:fs';

// Bounded RIFF/PCM inspection, without decoding audio or contacting remote URLs.
export function parseWaveMetadata(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 12 || bytes.toString('latin1', 0, 4) !== 'RIFF' || bytes.toString('latin1', 8, 12) !== 'WAVE') return null;
  const end = bytes.readUInt32LE(4) + 8;
  if (end !== bytes.length) return null;
  let format, dataSize;
  for (let offset = 12; offset < end;) {
    if (offset + 8 > end) return null;
    const type = bytes.toString('latin1', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4), start = offset + 8;
    if (start + size + (size % 2) > end) return null;
    if (type === 'fmt ') {
      if (format || size < 16 || bytes.readUInt16LE(start) !== 1) return null;
      format = { channels: bytes.readUInt16LE(start + 2), sampleRate: bytes.readUInt32LE(start + 4), byteRate: bytes.readUInt32LE(start + 8), blockAlign: bytes.readUInt16LE(start + 12), bitsPerSample: bytes.readUInt16LE(start + 14) };
    }
    if (type === 'data') { if (dataSize !== undefined) return null; dataSize = size; }
    offset = start + size + (size % 2);
  }
  if (!format || !dataSize) return null;
  const { channels, sampleRate, byteRate, blockAlign, bitsPerSample } = format;
  if (!channels || !sampleRate || ![8,16,24,32].includes(bitsPerSample) || blockAlign !== channels * bitsPerSample / 8 || byteRate !== sampleRate * blockAlign || dataSize % blockAlign) return null;
  return { container: 'WAV', codec: 'PCM', sampleRate, channels, bitsPerSample, bitrate: byteRate * 8, durationMs: dataSize / byteRate * 1000, fileSizeBytes: bytes.length };
}

// Only shipped demo files are inspected, once per API process. Never resolve a
// client URL into a filesystem path or request a remote resource.
const demos = new Map();
for (const id of [1, 2, 3]) {
  const path = new URL(`../public/audio/demo-${id}.wav`, import.meta.url);
  let metadata = null;
  try {
    const stat = lstatSync(path);
    if (stat.isFile() && stat.size <= 16 * 1024 * 1024) metadata = parseWaveMetadata(readFileSync(path));
  } catch { /* Missing demo audio must not prevent catalog reads or startup. */ }
  demos.set(`/api/v1/audio/demo-${id}.wav`, metadata);
}
export function audioMetadata(url) {
  const metadata = demos.get(url);
  return metadata ? { ...metadata } : null;
}
