import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.quantum_risk import assess_quantum_risk

cases = [
    ('RSA', 'KEY_ESTABLISHMENT', None),
    ('RSA', 'DIGITAL_SIGNATURE', None),
    ('ECDSA', 'DIGITAL_SIGNATURE', None),
    ('AES', 'SYMMETRIC_ENCRYPTION', 128),
    ('AES', 'SYMMETRIC_ENCRYPTION', 256),
    ('SHA256', 'HASH', None),
    ('MD5', 'HASH', None),
    ('NotARealAlgo', None, None),
    (None, None, None),
]
for algo, prim, ks in cases:
    result = assess_quantum_risk(algo, primitive_type=prim, key_size=ks)
    print(f'{algo!s:8} ks={ks!s:5} -> {result["quantum_status"]:10} score={result["quantum_risk_score"]}')