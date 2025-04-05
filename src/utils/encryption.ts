
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

export function encrypt(text: string): string {
  const SECRET_KEY = generateKey();
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
    const SECRET_KEY = generateKey();
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
