
// Format date from yyyy-dd-mm to dd/MM/yyyy
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Parse JSON safely
export const parseJson = <T>(jsonString: string, fallback: T): T => {
  if (!jsonString) return fallback;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

// Convert JSON string to array of objects
export const convertJsonToArray = (jsonString: string): Array<{id: string}> => {
  if (!jsonString) return [];
  
  try {
    // Check if the string already looks like an array
    if (jsonString.trim().startsWith('[')) {
      return JSON.parse(jsonString);
    }
    
    // Handle the case where we have multiple JSON objects concatenated
    // Example: {"id":"uid1"}{"id":"uid2"}
    const result: Array<{id: string}> = [];
    let remaining = jsonString.trim();
    
    while (remaining.length > 0) {
      try {
        // Find the end of the first JSON object
        const endBraceIndex = remaining.indexOf('}');
        if (endBraceIndex === -1) break;
        
        // Extract and parse the first JSON object
        const jsonObject = remaining.substring(0, endBraceIndex + 1);
        const parsedObject = JSON.parse(jsonObject);
        result.push(parsedObject);
        
        // Remove the parsed object from the remaining string
        remaining = remaining.substring(endBraceIndex + 1).trim();
      } catch (e) {
        // If we can't parse, move forward one character and try again
        remaining = remaining.substring(1).trim();
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error converting JSON to array:', error);
    return [];
  }
};

// Format remaining days
export const formatRemainingDays = (
  paymentDate: string,
  totalDays: number
): string => {
  if (!paymentDate || !totalDays) return '';
  
  try {
    // Parse payment date
    const parts = paymentDate.split('-');
    if (parts.length !== 3) return '';
    
    const paymentDateObj = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
    const today = new Date();
    
    // Calculate days passed
    const differenceInTime = today.getTime() - paymentDateObj.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    
    // Calculate remaining days
    const remainingDays = Math.max(0, totalDays - differenceInDays);
    
    return `${remainingDays} Dias`;
  } catch (error) {
    console.error('Error calculating remaining days:', error);
    return '';
  }
};

// Format IMEI data
export const formatImeiData = (imeiString: string): { IMEI: string; Dispositivo: string } => {
  if (!imeiString) return { IMEI: '', Dispositivo: '' };
  
  try {
    const imeiData = parseJson<{ IMEI: string; Dispositivo: string }>(
      imeiString,
      { IMEI: '', Dispositivo: '' }
    );
    
    return imeiData;
  } catch (error) {
    console.error('Error parsing IMEI data:', error);
    return { IMEI: '', Dispositivo: '' };
  }
};

// Format categories as an array
export const formatCategories = (categoriesString: string): string[] => {
  if (!categoriesString) return [];
  
  return categoriesString
    .split(',')
    .map(category => category.trim())
    .filter(Boolean);
};
