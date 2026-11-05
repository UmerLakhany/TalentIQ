import CryptoJS from 'crypto-js';

const encryptKeys = (keyToEncrypt: string): string => {
    const passphrase = process.env.PASSPHRASE;
    if (!passphrase) {
        throw new Error('PASSPHRASE environment variable is not defined');
    }
    const encryptedKey = CryptoJS.AES.encrypt(keyToEncrypt, passphrase).toString();
    return encryptedKey;
};

export default encryptKeys;
