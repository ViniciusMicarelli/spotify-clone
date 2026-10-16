"""Generate original, deterministic PCM demo loops using Python's standard library."""
import math
import struct
import wave
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / 'backend' / 'public' / 'audio'
OUTPUT.mkdir(parents=True, exist_ok=True)
RATE = 16000
for number, (seconds, notes) in enumerate([
    (8, [261.63, 329.63, 392.00, 523.25]),
    (10, [220.00, 261.63, 329.63, 440.00]),
    (12, [293.66, 369.99, 440.00, 587.33]),
], start=1):
    samples = bytearray()
    for frame in range(seconds * RATE):
        t = frame / RATE
        beat = t % 0.5
        frequency = notes[int(t / 0.5) % len(notes)]
        envelope = min(1, beat / 0.015) * math.exp(-beat * 5) * min(1, (seconds - t) / 0.1)
        tone = math.sin(2 * math.pi * frequency * t) + 0.2 * math.sin(4 * math.pi * frequency * t)
        samples.extend(struct.pack('<h', int(6000 * envelope * tone)))
    with wave.open(str(OUTPUT / f'demo-{number}.wav'), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(RATE)
        audio.writeframes(samples)
