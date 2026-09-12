"""Dedicated ECDSA (signature) and ECDH (key exchange) usage examples.

Added for Day 5 per WORK_DIVISION.md's shared demo dataset requirement,
which explicitly lists 'ECC/ECDSA/ECDH usage' as a required coverage
case that was previously missing from this sample repo.
"""
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF


def sign_with_ecdsa(private_key, message: bytes):
    """ECDSA digital signature -- primitive_type should resolve to
    'signature', quantum-vulnerable per SRS Recommendation Matrix."""
    return private_key.sign(message, ec.ECDSA(hashes.SHA256()))


def ecdh_key_exchange(my_private_key, peer_public_key):
    """ECDH key exchange -- primitive_type should resolve to
    'key_exchange', also quantum-vulnerable, but a different migration
    direction (KEM) than the signature case above."""
    shared_key = my_private_key.exchange(ec.ECDH(), peer_public_key)
    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"ecdat-demo",
    ).derive(shared_key)
    return derived_key