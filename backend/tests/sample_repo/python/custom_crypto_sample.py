"""Suspicious hand-rolled 'encryption' -- should trigger the custom-crypto
heuristic detector rather than any named-algorithm detector."""


def home_grown_encrypt(data: bytes, key: bytes):
    output = bytearray()
    for i in range(len(data)):
        b = data[i]
        b = b ^ key[i % len(key)]
        b = ((b << 3) | (b >> 5)) & 0xFF
        output.append(b)
    return bytes(output)