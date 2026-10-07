"""Synthesised soundtrack + sound design for the StudioOS TikTok ad.

Every hit is placed on the same timestamps as the animation in index.html,
so picture and sound stay locked. Output: 48 kHz stereo WAV.
Usage: python3 audio.py out.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 24.0
N = int(SR * DUR)
rng = np.random.default_rng(42)

mix = np.zeros((N, 2))
verb_send = np.zeros((N, 2))


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def place(x, at, gain=1.0, pan=0.0, verb=0.0):
    """Add mono or stereo buffer x at time `at` (seconds)."""
    if x.ndim == 1:
        l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        x = np.stack([x * l, x * r], 1) * np.sqrt(2)
    i = int(at * SR)
    if i >= N:
        return
    n = min(len(x), N - i)
    mix[i:i + n] += x[:n] * gain
    if verb:
        verb_send[i:i + n] += x[:n] * gain * verb


def env(d, a=0.002, decay=None, curve=6.0):
    t = t_arr(d)
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-t * (curve / (decay or d)))


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR / 2 - 100) / (SR / 2))
    return signal.lfilter(b, a, x, axis=0)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x, axis=0)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band")
    return signal.lfilter(b, a, x, axis=0)


def sweep_lp(x, f0, f1):
    """Time-varying lowpass via short overlapping blocks (cheap and smooth enough for noise)."""
    out = np.zeros_like(x)
    blk = 512
    nb = len(x) // blk + 1
    for k in range(nb):
        s = k * blk
        seg = x[s:s + blk * 2]
        if len(seg) == 0:
            break
        f = f0 * (f1 / f0) ** (k / max(nb - 1, 1))
        y = lp(seg, f) * np.hanning(len(seg))
        out[s:s + len(seg)] += y
    return out


def noise(d):
    return rng.standard_normal(int(SR * d))


# ---------------- instruments ----------------
def kick(gain=1.0):
    d = 0.45
    t = t_arr(d)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(d, 0.001, 0.45, 5)
    x += lp(noise(d), 3000) * env(d, 0.0005, 0.02, 6) * 0.25
    return np.tanh(x * 1.6) * gain


def boom(d=2.2):
    t = t_arr(d)
    f = 30 + 70 * np.exp(-t * 7)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, d, 4)
    x += lp(noise(d), 500) * env(d, 0.002, 0.6, 5) * 0.8
    x += bp(noise(d), 800, 6000) * env(d, 0.001, 0.12, 6) * 0.3
    return np.tanh(x * 1.4)


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    return hp(noise(d), 8000) * env(d, 0.0005, d, 6) * 0.35


def clap():
    d = 0.3
    x = np.zeros(int(SR * d))
    for k, off in enumerate([0, 0.011, 0.022]):
        b = bp(noise(d), 900, 4000) * env(d, 0.0005, 0.02 if k < 2 else 0.22, 6)
        i = int(off * SR)
        x[i:] += b[: len(x) - i]
    return x * 0.5


def tick(f=2400, d=0.05):
    t = t_arr(d)
    return np.sin(2 * np.pi * f * t) * env(d, 0.0005, d, 9) * 0.5


def pop(f0=900, f1=380, d=0.12):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.001, d, 7) * 0.6


def chime(freqs, d=1.2):
    t = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * t) * (0.6 ** k) for k, f in enumerate(freqs))
    x += 0.15 * np.sin(2 * np.pi * freqs[0] * 2.01 * t)
    return x * env(d, 0.002, d, 5) * 0.35


def whoosh(d=0.5, f0=300, f1=7000, peak=0.7):
    t = t_arr(d)
    x = sweep_lp(noise(d), f0, f1)
    shape = np.sin(np.pi * np.clip(t / d, 0, 1) ** (peak / (1 - peak) if peak < 1 else 1)) ** 2
    return hp(x, 120) * shape * 1.2


def riser(d=1.3):
    t = t_arr(d)
    x = sweep_lp(noise(d), 200, 9000) * (t / d) ** 2
    f = 200 * (8 ** (t / d))
    x += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 2
    return x


def reverse_suck(d=0.45):
    x = boom(d)[::-1] * 0.5 + whoosh(d, 6000, 300)[::-1] * 0.3
    return x


def saw(f, d, detune=(-0.08, 0, 0.07)):
    t = t_arr(d)
    return sum(signal.sawtooth(2 * np.pi * f * (1 + c / 12) * t) for c in detune) / len(detune)


def pad(freqs, d):
    x = sum(saw(f, d) for f in freqs) / len(freqs)
    x = lp(x, 1400)
    a = np.minimum(1, t_arr(d) / 0.25) * np.minimum(1, (d - t_arr(d)) / 0.4)
    return x * a * 0.22


def bass(f, d):
    t = t_arr(d)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * signal.sawtooth(2 * np.pi * f * t)
    a = np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.03)
    return lp(x, 900) * a * 0.5


# ---------------- arrangement ----------------
BPM = 120
BEAT = 60 / BPM
GRID0 = 2.5  # first downbeat = logo hit
MUSIC_END = 20.4

# Hook (0 – 2.5): ticks per word, accelerating clock, riser into implosion
hook_words = [0.0, 0.32, 0.62, 0.9, 1.16, 1.4]
for i, w in enumerate(hook_words):
    place(kick(0.55), w, 0.8)
    place(tick(1800 + i * 150, 0.08), w, 0.5, pan=(-1) ** i * 0.3)
place(boom(1.0), 1.62, 0.6, verb=0.3)
place(clap(), 1.62, 0.7, verb=0.4)
for i in range(12):  # notification pings
    place(pop(1400 + (i % 4) * 180, 700, 0.09), 0.05 + i * 0.13 + 0.03, 0.22, pan=(-1) ** i * 0.6)
clock = np.arange(0.0, 2.05, 0.08)
for c in clock:
    place(tick(4000, 0.02), c, 0.12)
place(riser(1.25), 0.8, 0.35)
place(reverse_suck(0.45), 2.05, 0.8)

# Logo hit
place(boom(2.5), 2.5, 1.0, verb=0.5)
place(chime([659.25, 987.77, 1318.5], 2.2), 2.55, 0.5, verb=0.6)
place(whoosh(0.6, 2000, 9000, 0.4), 2.55, 0.25, pan=-0.4)
# Zoom-through into the white bar
place(riser(0.6), 4.3, 0.4)
place(whoosh(0.6, 200, 9000, 0.85), 4.32, 0.7)
place(boom(1.2), 4.9, 0.55, verb=0.3)

# Beat bed: A minor-ish progression, 2 bars per chord
chords = [  # (bass Hz, pad freqs)
    (55.00, [220.0, 261.63, 329.63]),  # Am
    (43.65, [174.61, 220.0, 261.63]),  # F
    (65.41, [196.0, 261.63, 329.63]),  # C
    (49.00, [196.0, 246.94, 293.66]),  # G
]
bar = 4 * BEAT
music = np.zeros((N, 2))


def mplace(x, at, gain=1.0, pan=0.0):
    global mix
    save = mix.copy()
    place(x, at, gain, pan)
    music[:] += mix - save
    mix[:] = save


k = 0
t = GRID0
step = 0
while t < MUSIC_END - 0.01:
    beat_in_bar = step % 4
    # breakdown during the chat scene: drums thin out
    sparse = 11.1 <= t < 14.2
    if not sparse or beat_in_bar == 0:
        mplace(kick(), t, 0.9)
    if beat_in_bar in (1, 3) and not sparse:
        mplace(clap(), t, 0.55)
    mplace(hat(), t + BEAT / 2, 0.5, pan=0.3)
    if not sparse:
        mplace(hat(), t + BEAT / 4, 0.18, pan=-0.3)
        mplace(hat(), t + 3 * BEAT / 4, 0.18, pan=-0.3)
    if beat_in_bar == 0 and (step // 4) % 2 == 0:
        ci = (step // 8) % 4
        f, pf = chords[ci]
        mplace(pad(pf, 2 * bar), t, 1.0)
    # bass: 8th-note pulse, octave jump on the "and"
    f = chords[(step // 8) % 4][0]
    for h in (0, 1):
        mplace(bass(f * (2 if h else 1), BEAT / 2 - 0.02), t + h * BEAT / 2, 0.55)
    t += BEAT
    step += 1

# sidechain-style ducking on the music bed from every kick
duck = np.ones(N)
t = GRID0
while t < MUSIC_END:
    i = int(t * SR)
    d = np.linspace(0, 1, int(0.22 * SR)) ** 0.6
    j = min(N, i + len(d))
    duck[i:j] = np.minimum(duck[i:j], 0.45 + 0.55 * d[: j - i])
    t += BEAT
music[:, 0] *= duck
music[:, 1] *= duck
# fade the bed out into the end card
fade = np.ones(N)
a, b = int(20.2 * SR), int(20.5 * SR)
fade[a:b] = np.linspace(1, 0, b - a)
fade[b:] = 0
music *= fade[:, None]
mix += music * 0.8

# Scene transitions
for at, args in [(7.9, (0.45, 400, 8000, 0.7)), (11.0, (0.6, 300, 6000, 0.6)), (14.1, (0.45, 500, 9000, 0.7)),
                 (16.5, (0.35, 800, 9000, 0.8)), (18.4, (0.45, 400, 7000, 0.7))]:
    place(whoosh(*args), at, 0.6, pan=0.2)

# Booking scene UI
s3 = 4.9
for dt in (1.05, 1.55, 1.85, 2.35):
    place(pop(1100, 600, 0.06), s3 + dt, 0.45)
    place(tick(3000, 0.02), s3 + dt, 0.3)
place(chime([1046.5, 1568.0], 0.9), s3 + 2.45, 0.55, verb=0.4)
place(chime([1318.5, 1760.0], 0.8), s3 + 2.75, 0.35, pan=0.5, verb=0.4)
place(whoosh(0.4, 600, 8000, 0.8), s3 + 0.45, 0.35, pan=-0.6)  # QR card

# Calendar
place(pop(700, 400, 0.08), 9.05, 0.5)
place(whoosh(0.7, 300, 3000, 0.5), 9.3, 0.25)
place(kick(0.5), 10.0, 0.5)
place(pop(500, 250, 0.1), 10.0, 0.5)
place(chime([987.77, 1318.5], 0.8), 10.22, 0.45, verb=0.4)

# Chat
for at, f in [(11.65, 1200), (12.15, 1000), (12.75, 1500), (13.3, 1300)]:
    place(pop(f, f * 0.5, 0.1), at, 0.5, pan=-0.3 if at < 13 else 0.3, verb=0.2)

# Deposit: counter ticks then success
for i, at in enumerate(np.linspace(14.95, 15.75, 14)):
    place(tick(2000 + i * 80, 0.03), at, 0.25)
place(boom(0.8), 15.95, 0.4)
place(chime([1046.5, 1318.5, 1568.0, 2093.0], 1.4), 15.95, 0.6, verb=0.5)

# Rapid fire
for i in range(5):
    place(kick(0.8), 16.68 + i * 0.3, 0.6)
    place(tick(1500 + i * 200, 0.06), 16.68 + i * 0.3, 0.4)

# Mantra: soft swell + strike swish
place(pad([220.0, 277.18, 329.63, 440.0], 2.1), 18.5, 0.9)
place(whoosh(0.3, 2000, 9000, 0.3), 19.75, 0.45, pan=0.5)

# End card
place(boom(3.2), 20.45, 0.9, verb=0.5)
place(chime([440.0, 659.25, 880.0, 1318.5], 3.4), 20.5, 0.55, verb=0.7)
place(pad([220.0, 329.63, 440.0, 554.37], 3.4), 20.5, 0.8)
place(pop(900, 500, 0.12), 21.45, 0.5, verb=0.3)

# ---------------- reverb + master ----------------
ir_len = int(1.8 * SR)
tt = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)], 1) * np.exp(-tt * 3.2)[:, None]
ir = lp(ir, 5000)
ir /= np.sqrt((ir ** 2).sum(0))
wet = np.stack([signal.fftconvolve(verb_send[:, c], ir[:, c])[:N] for c in range(2)], 1)
mix += wet * 0.6

mix = hp(mix, 25)
end = np.ones(N)
fs = int(23.0 * SR)
end[fs:] = np.linspace(1, 0, N - fs) ** 2
mix *= end[:, None]
mix = np.tanh(mix * 1.1)
mix /= np.abs(mix).max() / 0.89
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else "soundtrack.wav", SR, (mix * 32767).astype(np.int16))
print("ok")
