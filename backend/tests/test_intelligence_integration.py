"""
Runs the full intelligence pipeline for a variety of findings and
prints every output field so that we can see what each layer produces.
"""

import sys
from pathlib import Path

# Make backend/ importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.classical_risk import assess_classical_risk
from intelligence.quantum_risk import assess_quantum_risk
from intelligence.mosca import assess_mosca
from intelligence.risk_score import compute_risk
from intelligence.recommendations import generate_recommendation

SEP = "=" * 78
SUB = "-" * 78

def run_pipeline(
    algorithm,
    primitive_type,
    key_size=None,
    mode=None,
    data_lifetime=None,
    migration_time=None,
    criticality="MEDIUM",
    confidence=0.95,
):
    """Run the full intelligence pipeline and return all intermediate results."""
    classical = assess_classical_risk(algorithm, key_size=key_size, mode=mode)
    quantum = assess_quantum_risk(
        algorithm, primitive_type=primitive_type, key_size=key_size
    )
    mosca = assess_mosca(
        data_lifetime_years=data_lifetime,
        migration_time_years=migration_time,
        quantum_status=quantum["quantum_status"],
    )
    risk = compute_risk(
        classical, quantum, mosca,
        business_criticality=criticality,
        detection_confidence=confidence,
    )
    recommendation = generate_recommendation(
        algorithm, primitive_type,
        quantum["quantum_status"], classical["classical_status"],
        severity=risk["severity"],
    )
    return {
        "classical": classical,
        "quantum": quantum,
        "mosca": mosca,
        "risk": risk,
        "recommendation": recommendation,
    }

def print_case(title, finding_desc, results):
    print(SEP)
    print(f"CASE: {title}")
    print(SUB)
    print(f"Finding: {finding_desc}")
    print()

    # Classical
    c = results["classical"]
    print(f"  [CLASSICAL] status={c['classical_status']}  score={c['classical_risk_score']}")
    for reason in c["classical_reasons"]:
        print(f"              - {reason}")

    # Quantum
    q = results["quantum"]
    print(f"  [QUANTUM]   status={q['quantum_status']}  score={q['quantum_risk_score']}")
    for reason in q["quantum_reasons"]:
        print(f"              - {reason}")

    # Mosca
    m = results["mosca"]
    print(f"  [MOSCA]     status={m['mosca_status']}  urgency={m['migration_urgency']}")
    if m.get("migration_deadline_years") is not None:
        print(f"              deadline={m['migration_deadline_years']}y")
    print(f"              - {m['explanation']}")

    # Risk
    r = results["risk"]
    capped_note = ""
    if r.get("confidence_capped"):
        capped_note = f"  [raw was {r.get('raw_severity')}, capped due to low confidence]"
    print()
    print(f"  [RISK]      score={r['risk_score']}  severity={r['severity']}{capped_note}")
    print(f"              Factors:")
    for f in r["risk_factors"]:
        print(f"                {f['factor']:12} weight={f['weight']:.2f}  "
              f"score={f['score']:3}  contribution={f['contribution']:.2f}")
    print(f"              Explanation: {r['explanation']}")

    # Recommendation
    rec = results["recommendation"]
    print()
    print(f"  [RECOMMENDATION]")
    print(f"              direction:  {rec['direction']}")
    print(f"              candidates: {', '.join(rec['candidate_algorithms']) or '(none)'}")
    print(f"              hybrid:     {rec['hybrid_path'] or '(none)'}")
    print(f"              priority:   {rec['migration_priority']}")
    print(f"              rationale:  {rec['rationale']}")
    print()


# =======================================================================
# Test cases
# =======================================================================

def main():
    print()
    print("#" * 78)
    print("# ECDAT Intelligence Layer Demonstration")
    print("#" * 78)
    print()

    # --- Case 1: RSA-1024 for key establishment, long-lived data ---
    print_case(
        "RSA-1024 key establishment, 15-year data",
        "RSA.generate(1024) used for session key exchange; health records; HIGH criticality",
        run_pipeline(
            algorithm="RSA",
            primitive_type="KEY_ESTABLISHMENT",
            key_size=1024,
            data_lifetime=15,
            migration_time=5,
            criticality="HIGH",
            confidence=0.95,
        ),
    )

    # --- Case 2: RSA-2048 for signatures, medium lifetime ---
    print_case(
        "RSA-2048 signature, 10-year data",
        "RSA-2048 signing firmware updates; 10-year support horizon; MEDIUM criticality",
        run_pipeline(
            algorithm="RSA",
            primitive_type="DIGITAL_SIGNATURE",
            key_size=2048,
            data_lifetime=10,
            migration_time=4,
            criticality="MEDIUM",
            confidence=0.9,
        ),
    )

    # --- Case 3: ECDSA-P256 signatures ---
    print_case(
        "ECDSA P-256 signature",
        "ECDSA P-256 used for TLS certificate signing; 5-year data lifetime",
        run_pipeline(
            algorithm="ECDSA",
            primitive_type="DIGITAL_SIGNATURE",
            key_size=256,
            data_lifetime=5,
            migration_time=3,
            criticality="HIGH",
            confidence=0.95,
        ),
    )

    # --- Case 4: AES-256-GCM symmetric, strong ---
    print_case(
        "AES-256-GCM symmetric encryption",
        "AES-256 in GCM mode for at-rest encryption; 10-year data; HIGH criticality",
        run_pipeline(
            algorithm="AES",
            primitive_type="SYMMETRIC_ENCRYPTION",
            key_size=256,
            mode="GCM",
            data_lifetime=10,
            migration_time=2,
            criticality="HIGH",
            confidence=0.98,
        ),
    )

    # --- Case 5: AES-128-GCM, weakened by Grover ---
    print_case(
        "AES-128-GCM, quantum-margin concern",
        "AES-128 in GCM mode; 15-year data; MEDIUM criticality",
        run_pipeline(
            algorithm="AES",
            primitive_type="SYMMETRIC_ENCRYPTION",
            key_size=128,
            mode="GCM",
            data_lifetime=15,
            migration_time=2,
            criticality="MEDIUM",
            confidence=0.98,
        ),
    )

    # --- Case 6: AES-256-ECB, mode downgrade ---
    print_case(
        "AES-256-ECB, weak mode",
        "AES-256 used in ECB mode; structure leaks; MEDIUM criticality",
        run_pipeline(
            algorithm="AES",
            primitive_type="SYMMETRIC_ENCRYPTION",
            key_size=256,
            mode="ECB",
            data_lifetime=5,
            migration_time=1,
            criticality="MEDIUM",
            confidence=0.9,
        ),
    )

    # --- Case 7: MD5 broken classically ---
    print_case(
        "MD5 hash, classically broken",
        "MD5 used for integrity checks; no quantum concern, but broken today",
        run_pipeline(
            algorithm="MD5",
            primitive_type="HASH",
            data_lifetime=5,
            migration_time=1,
            criticality="MEDIUM",
            confidence=0.95,
        ),
    )

    # --- Case 8: SHA-256, strong ---
    print_case(
        "SHA-256 hash, classically strong",
        "SHA-256 for integrity; no quantum concern",
        run_pipeline(
            algorithm="SHA256",
            primitive_type="HASH",
            data_lifetime=10,
            migration_time=1,
            criticality="MEDIUM",
            confidence=0.98,
        ),
    )

    # --- Case 9: Low-confidence custom crypto ---
    print_case(
        "Unknown custom crypto, low confidence",
        "Heuristic detects repeated XOR + rotation pattern; possibly custom cipher",
        run_pipeline(
            algorithm="NotARealAlgo",
            primitive_type=None,
            data_lifetime=20,
            migration_time=5,
            criticality="HIGH",
            confidence=0.25,
        ),
    )

    # --- Case 10: RSA with no key size known ---
    print_case(
        "RSA without key size (scanner limitation)",
        "RSA detected but key size not statically resolvable",
        run_pipeline(
            algorithm="RSA",
            primitive_type="KEY_ESTABLISHMENT",
            key_size=None,
            data_lifetime=10,
            migration_time=5,
            criticality="HIGH",
            confidence=0.7,
        ),
    )

    # --- Case 11: Missing business context ---
    print_case(
        "RSA-2048, no data lifetime provided",
        "RSA-2048 detected, but user hasn't provided business context",
        run_pipeline(
            algorithm="RSA",
            primitive_type="KEY_ESTABLISHMENT",
            key_size=2048,
            data_lifetime=None,
            migration_time=None,
            criticality=None,
            confidence=0.9,
        ),
    )

    print(SEP)
    print("Demo complete.")
    print(SEP)


if __name__ == "__main__":
    main()