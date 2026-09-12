import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.risk_score import compute_risk

# Simulate inputs from previous modules
broken_quantum = {'quantum_status': 'BROKEN', 'quantum_risk_score': 100}
resilient_quantum = {'quantum_status': 'RESILIENT', 'quantum_risk_score': 10}
broken_classical = {'classical_status': 'BROKEN', 'classical_risk_score': 95}
strong_classical = {'classical_status': 'STRONG', 'classical_risk_score': 5}
at_risk_mosca = {'mosca_status': 'AT_RISK', 'migration_urgency': 'IMMEDIATE'}
no_mosca = {'mosca_status': 'NOT_APPLICABLE', 'migration_urgency': 'UNKNOWN'}

cases = [
    ('RSA-1024 at-risk high-crit', broken_classical, broken_quantum, at_risk_mosca, 'HIGH', 0.95),
    ('RSA-2048 planned med-crit', {'classical_status': 'ACCEPTABLE', 'classical_risk_score': 25}, broken_quantum, {'migration_urgency': 'PLANNED'}, 'MEDIUM', 0.9),
    ('AES-256 strong', strong_classical, resilient_quantum, no_mosca, 'HIGH', 0.95),
    ('MD5 broken classical', broken_classical, resilient_quantum, no_mosca, 'MEDIUM', 0.95),
    ('Low confidence', broken_classical, broken_quantum, at_risk_mosca, 'HIGH', 0.2),
]
for name, c, q, m, crit, conf in cases:
    r = compute_risk(c, q, m, business_criticality=crit, detection_confidence=conf)
    print(f'{name:32} score={r["risk_score"]:6} severity={r["severity"]}')