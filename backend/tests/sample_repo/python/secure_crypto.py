"""Modern cryptography used correctly, for contrast in ECDAT test output."""
import hashlib
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def make_strong_rsa_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=4096)


def make_ec_key():
    return ec.generate_private_key(ec.SECP384R1())


def hash_data(data: bytes):
    return hashlib.sha256(data).hexdigest()


def encrypt_aes256(data, key, iv):
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    return encryptor.update(data) + encryptor.finalize()