"""Modern cryptography used correctly, for contrast in ECDAT test output."""
import hashlib
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305


def make_strong_rsa_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=4096)


def make_ec_key():
    return ec.generate_private_key(ec.SECP384R1())


def make_ed25519_key():
    return Ed25519PrivateKey.generate()


def encrypt_chacha20_poly1305(data, key, nonce):
    aead = ChaCha20Poly1305(key)
    return aead.encrypt(nonce, data, None)


def hash_data(data: bytes):
    return hashlib.sha256(data).hexdigest()


def encrypt_aes256(data, key, iv):
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    return encryptor.update(data) + encryptor.finalize()