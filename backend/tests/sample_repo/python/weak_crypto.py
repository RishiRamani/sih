"""Intentionally weak/legacy cryptography for ECDAT detection testing."""
import hashlib
from Crypto.PublicKey import RSA
from Crypto.Cipher import AES, DES


def make_rsa_key():
    # weak key size - should trigger a CRITICAL risk result downstream
    key = RSA.generate(1024)
    return key


def hash_password(password: str):
    return hashlib.md5(password.encode()).hexdigest()


def legacy_hash(data: bytes):
    return hashlib.sha1(data).hexdigest()


def encrypt_legacy(data, key):
    cipher = DES.new(key, DES.MODE_ECB)
    return cipher.encrypt(data)


def encrypt_aes(data, key):
    cipher = AES.new(key, AES.MODE_CBC)
    return cipher.encrypt(data)