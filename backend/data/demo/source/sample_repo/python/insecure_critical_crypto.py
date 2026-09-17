"""
SCANNER TEST FIXTURE - CRITICAL SEVERITY.

This file is designed to produce CRITICAL severity findings. It combines:
  - quantum-BROKEN algorithms (RSA, ECDH) - not just weak hashes
  - key material embedded in source
  - authentication surface
  - long-lived secrets

To trigger CRITICAL, scan with:
  business_criticality = CRITICAL
  data_lifetime_years >= 10
  migration_time_years >= 5

DO NOT USE IN PRODUCTION.
"""

import hashlib
from Crypto.PublicKey import RSA
from Crypto.PublicKey import ECC
from Crypto.Cipher import PKCS1_v1_5
from Crypto.Random import get_random_bytes


# CWE-798: hardcoded private key material committed to source.
# RSA-2048 private key, used live for authentication.
RSA_PRIVATE_KEY_PEM = b"""-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hy
vGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA8kQYOKX4
PLnQ4KAAAAAATESTDATANOTREALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END RSA PRIVATE KEY-----"""


# CWE-321: ECDH private scalar used for key agreement, committed to source.
# Elliptic curve key exchange is fully broken by Shor's algorithm.
ECDH_PRIVATE_KEY = bytes.fromhex(
    "1234567890abcdef" * 4
)


def sign_session(user_id: str) -> bytes:
    """Signs a session cookie with the hardcoded RSA private key.

    RSA signatures are quantum-broken. Because the key material is
    committed to source and used for session authentication, this is
    a CRITICAL finding when business criticality is set to CRITICAL.
    """
    key = RSA.import_key(RSA_PRIVATE_KEY_PEM)
    cipher = PKCS1_v1_5.new(key)
    return cipher.encrypt(user_id.encode())


def derive_session_key(peer_public_bytes: bytes) -> bytes:
    """Derives a session key using ECDH with a hardcoded private scalar.

    CWE-322: key exchange without entity authentication, and the
    private scalar itself is committed to source. Both findings are
    quantum-broken (ECDH is defeated by Shor's algorithm).
    """
    # Combine the committed scalar with attacker-supplied key material.
    # No validation that peer_public_bytes is on-curve.
    shared = hashlib.sha256(ECDH_PRIVATE_KEY + peer_public_bytes).digest()
    return shared


def generate_rsa_1024() -> RSA.RsaKey:
    """Generates a 1024-bit RSA key for signing.

    RSA-1024 is both classically weak (below recommended minimum) and
    quantum-broken. When used for long-lived signatures over sensitive
    data, this combination is CRITICAL.
    """
    return RSA.generate(1024)


def encrypt_payment_token(token: bytes) -> bytes:
    """Encrypts a payment token with RSA-2048.

    Payment data has a long lifetime (financial records retention is
    typically 7+ years). RSA-encrypted payment tokens are a classic
    harvest-now-decrypt-later target. This is the finding that pushes
    the file to CRITICAL under the Mosca urgency calculation.
    """
    key = RSA.import_key(RSA_PRIVATE_KEY_PEM)
    cipher = PKCS1_v1_5.new(key.publickey())
    return cipher.encrypt(token)