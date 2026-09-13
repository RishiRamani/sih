#include <iostream>

int main() {
    // Libraries
    const char* lib1 = "OpenSSL";
    const char* lib2 = "libcrypto";

    // AES
    const char* aes = "AES";
    const char* aes128 = "EVP_aes_128";
    const char* aes256 = "EVP_aes_256";

    // AES modes
    const char* gcm = "AES-GCM";
    const char* cbc = "AES-CBC";
    const char* ctr = "AES-CTR";
    const char* ecb = "AES-ECB";

    // RSA
    const char* rsa = "RSA";
    const char* rsa1024 = "RSA-1024";
    const char* rsa2048 = "RSA-2048";
    const char* rsa3072 = "RSA-3072";
    const char* rsa4096 = "RSA-4096";

    // RSA operations
    const char* rsaEncrypt = "RSA_public_encrypt";
    const char* rsaDecrypt = "RSA_private_decrypt";

    // Elliptic curve cryptography
    const char* ecdsa = "ECDSA";
    const char* ecdsaSign = "ECDSA_sign";
    const char* ecdh = "ECDH";

    // Hashes
    const char* sha256 = "SHA256";
    const char* sha1 = "SHA1";
    const char* md5 = "MD5";

    std::cout << "ECDAT binary scanner demo\n";

    std::cout << lib1 << "\n";
    std::cout << lib2 << "\n";

    std::cout << aes << "\n";
    std::cout << aes128 << "\n";
    std::cout << aes256 << "\n";

    std::cout << gcm << "\n";
    std::cout << cbc << "\n";
    std::cout << ctr << "\n";
    std::cout << ecb << "\n";

    std::cout << rsa << "\n";
    std::cout << rsa1024 << "\n";
    std::cout << rsa2048 << "\n";
    std::cout << rsa3072 << "\n";
    std::cout << rsa4096 << "\n";

    std::cout << rsaEncrypt << "\n";
    std::cout << rsaDecrypt << "\n";

    std::cout << ecdsa << "\n";
    std::cout << ecdsaSign << "\n";
    std::cout << ecdh << "\n";

    std::cout << sha256 << "\n";
    std::cout << sha1 << "\n";
    std::cout << md5 << "\n";

    return 0;
}