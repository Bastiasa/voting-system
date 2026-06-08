import dgram from 'dgram';
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const password = 'perro salchicha gordo bachicha, toma solcito a la orilla del mar.';
const key = crypto.scryptSync(password, 'salt', 32);


function decryptAES(data) {
    const iv = data.subarray(0, 16);
    const encryptedData = data.subarray(16);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
}

const socket = dgram.createSocket("udp4", (msg, remoteInfo) => {
    const decodedMessage = decryptAES(msg).toString("utf-8");
    console.log(decodedMessage);
    console.log("Received.");
    
});
 
socket.bind(8999, '0.0.0.0', () => {
    socket.setBroadcast(true);
})