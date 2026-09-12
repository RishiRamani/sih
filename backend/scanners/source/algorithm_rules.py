import re

# --- Lexical (name/keyword) patterns -----------------------------------
# Lowest-confidence signal: the algorithm name appears somewhere in the
# file, regardless of whether it's an actual API call, a comment, or a
# string literal. (name -> (regex, primitive_type))
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


# --- API / call-signature patterns (higher confidence) ------------------
# Each entry should have at most one capturing group, used to pull out a
# numeric key size when one is syntactically available.
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

    # ---------------- Go (crypto/*, added Day 3) ----------------
    dict(language="go", algorithm="RSA", primitive_type="asymmetric",
         library="crypto/rsa", pattern=r"rsa\.GenerateKey\([^,]*,\s*(\d+)\)"),
    dict(language="go", algorithm="AES", primitive_type="symmetric",
         library="crypto/aes", pattern=r"aes\.NewCipher\("),
    dict(language="go", algorithm="DES", primitive_type="symmetric",
         library="crypto/des", pattern=r"des\.NewCipher\("),
    dict(language="go", algorithm="3DES", primitive_type="symmetric",
         library="crypto/des", pattern=r"des\.NewTripleDESCipher\("),
    dict(language="go", algorithm="MD5", primitive_type="hash",
         library="crypto/md5", pattern=r"md5\.(?:New|Sum)\("),
    dict(language="go", algorithm="SHA1", primitive_type="hash",
         library="crypto/sha1", pattern=r"sha1\.(?:New|Sum)\("),
    dict(language="go", algorithm="SHA256", primitive_type="hash",
         library="crypto/sha256", pattern=r"sha256\.(?:New|Sum256)\("),
    dict(language="go", algorithm="SHA512", primitive_type="hash",
         library="crypto/sha512", pattern=r"sha512\.(?:New|Sum512)\("),
    dict(language="go", algorithm="HMAC", primitive_type="hash",
         library="crypto/hmac", pattern=r"hmac\.New\("),
    dict(language="go", algorithm="ECDSA", primitive_type="signature",
         library="crypto/ecdsa", pattern=r"ecdsa\.GenerateKey\("),
    dict(language="go", algorithm="EdDSA", variant="Ed25519", primitive_type="signature",
         library="crypto/ed25519", pattern=r"ed25519\.GenerateKey\("),

    # ---------------- EdDSA / Ed25519 / Ed448 (Day 3 addition) --------
    # `algorithm` must stay the CycloneDX family name ("EdDSA"); the
    # specific curve goes in `variant` (fixed via api_detector.py's
    # `variant` override, since the curve isn't derivable from the call
    # site's key size or a mode keyword).
    dict(language="python", algorithm="EdDSA", variant="Ed25519", primitive_type="signature",
         library="cryptography", pattern=r"Ed25519PrivateKey\.generate\("),
    dict(language="python", algorithm="EdDSA", variant="Ed448", primitive_type="signature",
         library="cryptography", pattern=r"Ed448PrivateKey\.generate\("),
    dict(language="javascript", algorithm="EdDSA", variant="Ed25519", primitive_type="signature",
         library="node:crypto", pattern=r"generateKeyPair(?:Sync)?\(\s*['\"]ed25519['\"]"),
    dict(language="java", algorithm="EdDSA", variant="Ed25519", primitive_type="signature",
         library="java.security", pattern=r'KeyPairGenerator\.getInstance\(\s*"Ed25519"'),

    # ---------------- ChaCha20-Poly1305 AEAD construction (Day 3) -----
    # Same rule: "ChaCha20" is the valid family name; "ChaCha20-Poly1305"
    # (the combined AEAD construction) is a variant of it, not a family
    # in its own right.
    dict(language="python", algorithm="ChaCha20", variant="ChaCha20-Poly1305", primitive_type="symmetric",
         library="cryptography", pattern=r"ChaCha20Poly1305\("),
    dict(language="javascript", algorithm="ChaCha20", variant="ChaCha20-Poly1305", primitive_type="symmetric",
         library="node:crypto", pattern=r"create(?:Cipheriv|Decipheriv)\(\s*['\"]chacha20-poly1305['\"]"),
]

# ---------------- AES/DES block-cipher MODE detection (Day 3) ----------
# Separate from API_SIGNATURES because a mode is a *qualifier* on an
# already-detected cipher, not a standalone algorithm. Captured into the
# finding's `variant` field (e.g. "AES-GCM") rather than a new contract
# field, since the shared finding contract (WORK_DIVISION.md sec 3) has
# no dedicated `mode` field.
MODE_PATTERNS = [
    dict(pattern=r"\bMODE_GCM\b|modes\.GCM\(|/GCM/|-gcm", mode="GCM"),
    dict(pattern=r"\bMODE_CTR\b|modes\.CTR\(|/CTR/|-ctr", mode="CTR"),
    dict(pattern=r"\bMODE_CBC\b|modes\.CBC\(|/CBC/|-cbc", mode="CBC"),
    dict(pattern=r"\bMODE_ECB\b|modes\.ECB\(|/ECB/|-ecb", mode="ECB"),
]
for _m in MODE_PATTERNS:
    _m["compiled"] = re.compile(_m["pattern"], re.IGNORECASE)


def detect_mode_on_line(line: str):
    """Returns the block-cipher mode name (e.g. 'GCM') if the line
    mentions one, else None. ECB is flagged distinctly downstream by the
    risk engine (Shubh's side) as a weak-mode indicator -- not this
    module's concern, we only report what's observed."""
    for m in MODE_PATTERNS:
        if m["compiled"].search(line):
            return m["mode"]
    return None

for _sig in API_SIGNATURES:
    _sig["compiled"] = re.compile(_sig["pattern"])


def lexical_matches():
    return _COMPILED_LEXICAL


def api_signatures_for_language(language: str):
    return [s for s in API_SIGNATURES if s["language"] == language]