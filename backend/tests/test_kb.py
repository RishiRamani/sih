import sys
from pathlib import Path

# Make `backend/` importable regardless of where the test is run from
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.crypto_kb import (
    get_kb_version,
    lookup_algorithm,
    get_recommendation,
)

print("Test 1 — KB version:", get_kb_version())

print("Test 2 — RSA lookup:", "PASS" if lookup_algorithm("RSA") else "FAIL")

print("Test 3 — alias resolution:", "PASS" if lookup_algorithm("rsa-oaep") else "FAIL")

print("Test 4 — unknown returns None:",
      "PASS" if lookup_algorithm("MyCustomRot13Cipher") is None else "FAIL")

print("Test 5 — case insensitivity:",
      "PASS" if all([
          lookup_algorithm("aes"),
          lookup_algorithm("AES"),
          lookup_algorithm("Aes"),
      ]) else "FAIL")

kem_rec = get_recommendation("RSA", "KEY_ESTABLISHMENT")
sig_rec = get_recommendation("RSA", "DIGITAL_SIGNATURE")

print("Test 6a — RSA/KEM recommendation:",
      "PASS" if kem_rec and kem_rec.get("direction") == "KEM" else "FAIL")

print("Test 6b — RSA/SIGNATURE recommendation:",
      "PASS" if sig_rec and sig_rec.get("direction") == "SIGNATURE" else "FAIL")

print("Test 6c — KEM != SIGNATURE:",
      "PASS" if kem_rec != sig_rec else "FAIL")

print("Test 7 — nonsensical primitive:",
      "PASS" if get_recommendation("RSA", "HASH") is None else "FAIL")

def test_lookup_algorithm_is_case_insensitive_for_canonical_names():
    assert lookup_algorithm("EdDSA") is not None
    assert lookup_algorithm("eddsa") is not None
    assert lookup_algorithm("EDDSA") is not None