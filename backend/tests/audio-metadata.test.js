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

test('waveform peaks reflect PCM samples, silence and all channels with bounded output', async () => {
  const { wavePeaks, audioWaveform } = await import('../data/audio-metadata.js');
  const demo = audioWaveform('/api/v1/audio/demo-1.wav');
  assert.equal(demo.peaks.length, 96); assert.equal(demo.durationMs, 8000);
  assert.ok(demo.peaks.some(peak => peak > 0));
  assert.ok(demo.peaks.every(peak => Number.isFinite(peak) && peak >= 0 && peak <= 1));
  demo.peaks[0] = 9;
  assert.notEqual(audioWaveform('/api/v1/audio/demo-1.wav').peaks[0], 9);
  assert.equal(audioWaveform('https://example.com/audio.wav'), null);
  assert.equal(wavePeaks(Buffer.alloc(5)), null);
  // A stereo 16-bit file where only the second channel reaches full scale.
  const stereo = Buffer.alloc(44 + 96 * 4);
  original.copy(stereo, 0, 0, 44);
  stereo.writeUInt32LE(stereo.length - 8, 4); stereo.writeUInt16LE(2, 22);
  stereo.writeUInt32LE(64000, 28); stereo.writeUInt16LE(4, 32); stereo.writeUInt32LE(96 * 4, 40);
  stereo.writeInt16LE(-32768, 46);
  const peaks = wavePeaks(stereo).peaks;
  assert.equal(peaks[0], 1); assert.ok(peaks.slice(1).every(peak => peak === 0));
  stereo.fill(0, 44); assert.ok(wavePeaks(stereo).peaks.every(peak => peak === 0));
  for (const bits of [8, 24, 32]) {
    const width = bits / 8, bytes = Buffer.alloc(44 + 96 * width);
    original.copy(bytes, 0, 0, 44);
    bytes.writeUInt32LE(bytes.length - 8, 4); bytes.writeUInt32LE(16000 * width, 28);
    bytes.writeUInt16LE(width, 32); bytes.writeUInt16LE(bits, 34); bytes.writeUInt32LE(96 * width, 40);
    if (bits === 8) { bytes.fill(128, 44); bytes[44] = 0; }
    else bytes.writeIntLE(-(2 ** (bits - 1)), 44, width);
    const result = wavePeaks(bytes).peaks;
    assert.equal(result[0], 1); assert.ok(result.slice(1).every(peak => peak === 0));
  }
});
