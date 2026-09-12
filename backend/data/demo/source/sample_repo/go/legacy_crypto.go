// Go cryptography sample -- added Day 3 to exercise the new Go
// API-signature coverage in algorithm_rules.py.
package legacycrypto

import (
	"crypto/aes"
	"crypto/des"
	"crypto/ecdsa"
	"crypto/hmac"
	"crypto/md5"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
)

func WeakRSAKey() (*rsa.PrivateKey, error) {
	// intentionally weak key size for detection testing
	return rsa.GenerateKey(rand.Reader, 1024)
}

func HashPassword(password []byte) [16]byte {
	return md5.Sum(password)
}

func LegacyHash(data []byte) [20]byte {
	return sha1.Sum(data)
}

func ModernHash(data []byte) [32]byte {
	return sha256.Sum256(data)
}

func NewAESCipher(key []byte) (interface{}, error) {
	return aes.NewCipher(key)
}

func NewDESCipher(key []byte) (interface{}, error) {
	return des.NewCipher(key)
}

func MakeHMAC() {
	hmac.New(sha256.New, []byte("secret"))
}

func GenerateECDSAKey() {
	ecdsa.GenerateKey(nil, rand.Reader)
}