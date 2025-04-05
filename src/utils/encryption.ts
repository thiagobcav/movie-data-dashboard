
/**
 * Enhanced encryption and decryption utilities
 * Not meant for serious security purposes but to make it 
 * harder for casual users to access sensitive data
 */

// We avoid storing sensitive keys in the client-side code
const generateKey = () => {
  // Generate a key based on domain to make it harder to extract
  const domain = window.location.host;
  const date = new Date().toISOString().slice(0, 10); // Current date in YYYY-MM-DD format
  return `ADMINPANEL_${domain}_${date}`;
};

// Additional security through code obfuscation
const encryptChar = (char: string, key: string, pos: number): string => {
  const charCode = char.charCodeAt(0);
  const keyChar = key.charCodeAt(pos % key.length);
  // XOR with key character and add some shift based on position
  return String.fromCharCode(charCode ^ keyChar ^ (pos % 7));
};

export function encrypt(text: string): string {
  if (!text) return '';
  
  const SECRET_KEY = generateKey();
  // Simple XOR encryption with a key and position-based obfuscation
  const result = [];
  for (let i = 0; i < text.length; i++) {
    result.push(encryptChar(text[i], SECRET_KEY, i));
  }
  
  // Convert to base64 to make it harder to read and safe for storage
  return btoa(result.join(''));
}

export function decrypt(encrypted: string): string {
  if (!encrypted) return '';
  
  try {
    const SECRET_KEY = generateKey();
    // Decode from base64
    const encryptedText = atob(encrypted);
    // Reverse the XOR operation
    const result = [];
    for (let i = 0; i < encryptedText.length; i++) {
      result.push(encryptChar(encryptedText[i], SECRET_KEY, i));
    }
    return result.join('');
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

// Add an additional layer of obfuscation for sensitive keys
export function obfuscateKey(key: string): string {
  // Split the key in parts and reverse the order
  const parts = key.match(/.{1,8}/g) || [];
  return parts.reverse().join('');
}
