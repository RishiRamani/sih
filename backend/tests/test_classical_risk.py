import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.classical_risk import assess_classical_risk

cases = [
    ('MD5', None, None),
    ('SHA1', None, None),
    ('RSA', 1024, None),
    ('RSA', 2048, None),
    ('RSA', 4096, None),
    ('RSA', None, None),
    ('AES', 128, None),
    ('AES', 256, 'GCM'),
    ('AES', 256, 'ECB'),
    ('NotARealAlgo', None, None),
    (None, None, None),
]
for algo, ks, mode in cases:
    result = assess_classical_risk(algo, key_size=ks, mode=mode)
    print(f'{algo!s:14} ks={ks!s:5} mode={mode!s:5} -> {result["classical_status"]:12} score={result["classical_risk_score"]}')