import re

_SECP_CURVE_SIZES = {
    "192": 192, "224": 224, "256": 256, "384": 384, "521": 521,
}

_AES_KEYWORD_SIZE = re.compile(r"aes-?(128|192|256)", re.IGNORECASE)

def extract_key_size_from_match(match: "re.Match", algorithm: str) :
    """Returns an int key size if the API pattern captured one, else None."""
    if match.lastindex:
        captured = match.group(1)
        if captured and captured.isdigit():
            size = int(captured)
            if algorithm == "ECDSA":
                return _SECP_CURVE_SIZES.get(captured, size)
            return size
 
    # Fallback: look for an explicit AES-128/192/256 style keyword in the
    # matched text itself.
    aes_hit = _AES_KEYWORD_SIZE.search(match.group(0))
    if aes_hit:
        return int(aes_hit.group(1))
 
    return None