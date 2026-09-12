import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.recommendations import generate_recommendation

cases = [
    ('RSA', 'KEY_ESTABLISHMENT', 'BROKEN', 'ACCEPTABLE', 'CRITICAL'),
    ('RSA', 'DIGITAL_SIGNATURE', 'BROKEN', 'ACCEPTABLE', 'HIGH'),
    ('AES', 'SYMMETRIC_ENCRYPTION', 'WEAKENED', 'ACCEPTABLE', 'MEDIUM'),
    ('MD5', 'HASH', 'WEAKENED', 'BROKEN', 'HIGH'),
    ('SHA256', 'HASH', 'RESILIENT', 'STRONG', 'INFORMATIONAL'),
    ('NotARealAlgo', 'HASH', 'UNKNOWN', 'UNKNOWN', 'MEDIUM'),
    ('RSA', None, 'BROKEN', 'ACCEPTABLE', 'HIGH'),
]
for algo, prim, q, c, sev in cases:
    r = generate_recommendation(algo, prim, q, c, severity=sev)
    print(f'{algo!s:14} {prim!s:22} -> {r["direction"]:14} {r["candidate_algorithms"]}')
    print(f'   priority={r["migration_priority"]}')