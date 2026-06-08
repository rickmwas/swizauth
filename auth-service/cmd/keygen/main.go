package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	certDir := "certs"
	if err := os.MkdirAll(certDir, 0755); err != nil {
		fmt.Printf("Failed to create certs directory: %v\n", err)
		os.Exit(1)
	}

	privateKeyPath := filepath.Join(certDir, "private.pem")
	publicKeyPath := filepath.Join(certDir, "public.pem")

	// Generate 2048-bit RSA key pair
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		fmt.Printf("Failed to generate RSA private key: %v\n", err)
		os.Exit(1)
	}

	// Save private key PEM
	privFile, err := os.Create(privateKeyPath)
	if err != nil {
		fmt.Printf("Failed to create private key file: %v\n", err)
		os.Exit(1)
	}
	defer privFile.Close()

	privBlock := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	}
	if err := pem.Encode(privFile, privBlock); err != nil {
		fmt.Printf("Failed to encode private key PEM: %v\n", err)
		os.Exit(1)
	}

	// Marshal public key to PKIX DER bytes
	pubASN1, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		fmt.Printf("Failed to marshal public key: %v\n", err)
		os.Exit(1)
	}

	// Save public key PEM
	pubFile, err := os.Create(publicKeyPath)
	if err != nil {
		fmt.Printf("Failed to create public key file: %v\n", err)
		os.Exit(1)
	}
	defer pubFile.Close()

	pubBlock := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubASN1,
	}
	if err := pem.Encode(pubFile, pubBlock); err != nil {
		fmt.Printf("Failed to encode public key PEM: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Development RSA RS256 key pair successfully generated in 'auth-service/certs/'")
}
