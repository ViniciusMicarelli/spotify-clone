import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseWaveMetadata, audioMetadata } from '../data/audio-metadata.js';
const original = readFileSync(new URL('../public/audio/demo-1.wav', import.meta.url));
test('shipped PCM metadata comes from bytes and is returned only for allowlisted URLs', () => {
  for (const id of [1,2,3]) {
    const bytes = readFileSync(new URL(`../public/audio/demo-${id}.wav`, import.meta.url));
    const metadata = audioMetadata(`/api/v1/audio/demo-${id}.wav`);
    assert.deepEqual(metadata, { container: 'WAV', codec: 'PCM', sampleRate: 16000, channels: 1, bitsPerSample: 16, bitrate: 256000, durationMs: [8000,10000,12000][id-1], fileSizeBytes: bytes.length });
    assert.deepEqual(parseWaveMetadata(bytes), metadata);
  }
  for (const url of ['https://example.com/demo-1.wav', '/api/v1/audio/../demo-1.wav', '/api/v1/audio/demo-1.wav?x=1', '/api/v1/audio/missing.wav', 'file:///etc/passwd']) assert.equal(audioMetadata(url), null);
  const metadata = audioMetadata('/api/v1/audio/demo-1.wav'); metadata.codec = 'Changed';
  assert.equal(audioMetadata('/api/v1/audio/demo-1.wav').codec, 'PCM');
});
test('RIFF parsing skips padded chunks and rejects truncation, invalid sizes and unsupported encoding', () => {
  const padded = Buffer.concat([original.subarray(0,12), Buffer.from('JUNK'), Buffer.from([1,0,0,0,9,0]), original.subarray(12)]);
  padded.writeUInt32LE(padded.length - 8, 4);
  assert.equal(parseWaveMetadata(padded).durationMs, 8000);
  for (const length of [0,8,12,19,35,43,original.length-1]) assert.equal(parseWaveMetadata(original.subarray(0,length)), null);
  for (const [offset, value, method] of [[4, 0xffffffff, 'writeUInt32LE'], [20, 3, 'writeUInt16LE'], [22, 0, 'writeUInt16LE'], [24, 0, 'writeUInt32LE'], [28, 1, 'writeUInt32LE'], [32, 1, 'writeUInt16LE'], [34, 7, 'writeUInt16LE'], [40, 0xffffffff, 'writeUInt32LE']]) {
    const bytes = Buffer.from(original); bytes[method](value, offset); assert.equal(parseWaveMetadata(bytes), null);
  }
});
