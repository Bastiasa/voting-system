import crypto from "crypto";
import fs from 'fs';

// Generar el par de claves RSA
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,  // Tamaño en bits de la clave (mínimo recomendado: 2048)
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

// Guardar las claves en archivos
fs.writeFileSync('public.pem', publicKey);
fs.writeFileSync('private.pem', privateKey);

console.log('Claves RSA generadas y guardadas.');
