import re


LEXICAL_PATTERNS = {
    "RSA":        (r"\bRSA\b", "asymmetric"),
    "AES":        (r"\bAES(?:-?(?:128|192|256))?\b", "symmetric"),
    "DES":        (r"\bDES\b(?!3|ede)", "symmetric"),
    "3DES":       (r"\b3DES\b|TripleDES|DESede", "symmetric"),
    "ECDSA":      (r"\bECDSA\b", "signature"),
    "ECDH":       (r"\bECDH\b", "key_exchange"),
    "EdDSA":      (r"\bEdDSA\b|\bEd25519\b|\bEd448\b", "signature"),
    "DH":         (r"DiffieHellman|Diffie-Hellman|(?<![A-Za-z])DH(?![A-Za-z])", "key_exchange"),
    "MD5":        (r"\bMD5\b", "hash"),
    "SHA1":       (r"\bSHA-?1\b", "hash"),
    "SHA256":     (r"\bSHA-?256\b", "hash"),
    "SHA384":     (r"\bSHA-?384\b", "hash"),
    "SHA512":     (r"\bSHA-?512\b", "hash"),
    "SHA3":       (r"\bSHA-?3(?:-?(?:256|384|512))?\b", "hash"),
    "HMAC":       (r"\bHMAC\b", "hash"),
    "ChaCha20":   (r"\bChaCha20\b", "symmetric"),
    "Poly1305":   (r"\bPoly1305\b", "symmetric"),
    "RC4":        (r"\bRC4\b", "symmetric"),
    "Blowfish":   (r"\bBlowfish\b", "symmetric"),
}

_COMPILED_LEXICAL = {
    name: (re.compile(pattern, re.IGNORECASE), primitive)
    for name, (pattern, primitive) in LEXICAL_PATTERNS.items()
}

API_SIGNATURES = [
    # ---------------- Python ----------------
    dict(language="python", algorithm="RSA", primitive_type="asymmetric",
         library="pycryptodome", pattern=r"RSA\.generate\(\s*(\d+)"),
    dict(language="python", algorithm="RSA", primitive_type="asymmetric",
         library="cryptography", pattern=r"rsa\.generate_private_key\([^)]*key_size\s*=\s*(\d+)"),
    dict(language="python", algorithm="AES", primitive_type="symmetric",
         library="pycryptodome", pattern=r"AES\.new\("),
    dict(language="python", algorithm="AES", primitive_type="symmetric",
         library="cryptography", pattern=r"algorithms\.AES\("),
    dict(language="python", algorithm="3DES", primitive_type="symmetric",
         library="cryptography", pattern=r"algorithms\.TripleDES\("),
    dict(language="python", algorithm="DES", primitive_type="symmetric",
         library="pycryptodome", pattern=r"\bDES\.new\("),
    dict(language="python", algorithm="ChaCha20", primitive_type="symmetric",
         library="cryptography", pattern=r"algorithms\.ChaCha20\("),
    dict(language="python", algorithm="MD5", primitive_type="hash",
         library="hashlib", pattern=r"hashlib\.md5\("),
    dict(language="python", algorithm="SHA1", primitive_type="hash",
         library="hashlib", pattern=r"hashlib\.sha1\("),
    dict(language="python", algorithm="SHA256", primitive_type="hash",
         library="hashlib", pattern=r"hashlib\.sha256\("),
    dict(language="python", algorithm="SHA384", primitive_type="hash",
         library="hashlib", pattern=r"hashlib\.sha384\("),
    dict(language="python", algorithm="SHA512", primitive_type="hash",
         library="hashlib", pattern=r"hashlib\.sha512\("),
    dict(language="python", algorithm="SHA3", primitive_type="hash",
         library="hashlib", pattern=r"hashlib\.sha3_(?:256|384|512)\("),
    dict(language="python", algorithm="HMAC", primitive_type="hash",
         library="hmac", pattern=r"\bhmac\.new\("),
    dict(language="python", algorithm="ECDSA", primitive_type="signature",
         library="cryptography", pattern=r"ec\.generate_private_key\(\s*ec\.SECP(\d+)"),
    dict(language="python", algorithm="DSA", primitive_type="signature",
         library="cryptography", pattern=r"dsa\.generate_private_key\("),
 
    # ---------------- JavaScript / TypeScript (Node crypto) ----------------
    dict(language="javascript", algorithm="MD5", primitive_type="hash",
         library="node:crypto", pattern=r"createHash\(\s*['\"]md5['\"]"),
    dict(language="javascript", algorithm="SHA1", primitive_type="hash",
         library="node:crypto", pattern=r"createHash\(\s*['\"]sha1['\"]"),
    dict(language="javascript", algorithm="SHA256", primitive_type="hash",
         library="node:crypto", pattern=r"createHash\(\s*['\"]sha256['\"]"),
    dict(language="javascript", algorithm="AES", primitive_type="symmetric",
         library="node:crypto", pattern=r"create(?:Cipheriv|Decipheriv)\(\s*['\"]aes-?(\d+)?"),
    dict(language="javascript", algorithm="RSA", primitive_type="asymmetric",
         library="node:crypto", pattern=r"generateKeyPair(?:Sync)?\(\s*['\"]rsa['\"]"),
    dict(language="javascript", algorithm="HMAC", primitive_type="hash",
         library="node:crypto", pattern=r"createHmac\("),
    dict(language="javascript", algorithm="ECDSA", primitive_type="signature",
         library="node:crypto", pattern=r"generateKeyPair(?:Sync)?\(\s*['\"]ec['\"]"),
    dict(language="javascript", algorithm="RSA", primitive_type="signature",
         library="node:crypto", pattern=r"createSign\(\s*['\"]RSA-SHA\d+['\"]"),
 
    # ---------------- Java ----------------
    dict(language="java", algorithm="MD5", primitive_type="hash",
         library="java.security", pattern=r'MessageDigest\.getInstance\(\s*"MD5"'),
    dict(language="java", algorithm="SHA1", primitive_type="hash",
         library="java.security", pattern=r'MessageDigest\.getInstance\(\s*"SHA-1"'),
    dict(language="java", algorithm="SHA256", primitive_type="hash",
         library="java.security", pattern=r'MessageDigest\.getInstance\(\s*"SHA-256"'),
    dict(language="java", algorithm="AES", primitive_type="symmetric",
         library="javax.crypto", pattern=r'Cipher\.getInstance\(\s*"AES'),
    dict(language="java", algorithm="DES", primitive_type="symmetric",
         library="javax.crypto", pattern=r'Cipher\.getInstance\(\s*"DES'),
    dict(language="java", algorithm="3DES", primitive_type="symmetric",
         library="javax.crypto", pattern=r'Cipher\.getInstance\(\s*"DESede'),
    dict(language="java", algorithm="RSA", primitive_type="asymmetric",
         library="java.security", pattern=r'KeyPairGenerator\.getInstance\(\s*"RSA"'),
    dict(language="java", algorithm="ECDSA", primitive_type="signature",
         library="java.security", pattern=r'KeyPairGenerator\.getInstance\(\s*"EC"'),
 
    # ---------------- C/C++ (OpenSSL) ----------------
    dict(language="c", algorithm="AES", primitive_type="symmetric",
         library="openssl", pattern=r"EVP_aes_\d+_\w+\("),
    dict(language="c", algorithm="RSA", primitive_type="asymmetric",
         library="openssl", pattern=r"RSA_generate_key(?:_ex)?\("),
    dict(language="c", algorithm="MD5", primitive_type="hash",
         library="openssl", pattern=r"MD5(?:_Init|\()"),
    dict(language="c", algorithm="SHA1", primitive_type="hash",
         library="openssl", pattern=r"SHA1(?:_Init|\()"),
    dict(language="c", algorithm="SHA256", primitive_type="hash",
         library="openssl", pattern=r"SHA256(?:_Init|\()"),
]

for _sig in API_SIGNATURES:
    _sig["compiled"] = re.compile(_sig["pattern"])
 
 
def lexical_matches():
    return _COMPILED_LEXICAL
 
 
def api_signatures_for_language(language: str):
    return [s for s in API_SIGNATURES if s["language"] == language]
 