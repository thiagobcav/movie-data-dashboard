
/**
 * Simple encryption and decryption utilities
 * Note: This is not meant for serious security purposes
 * but to make it harder for casual users to access sensitive data
 */

const SECRET_KEY = 'ADMINPANELSECRETKEY2024';

export function encrypt(text: string): string {
  // Simple XOR encryption with a key
  const result = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result.push(String.fromCharCode(charCode));
  }
  // Convert to base64 to make it harder to read and safe for storage
  return btoa(result.join(''));
}

export function decrypt(encrypted: string): string {
  try {
    // Decode from base64
    const encryptedText = atob(encrypted);
    // Reverse the XOR operation
    const result = [];
    for (let i = 0; i < encryptedText.length; i++) {
      const charCode = encryptedText.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      result.push(String.fromCharCode(charCode));
    }
    return result.join('');
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}
