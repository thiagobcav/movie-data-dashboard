
/**
 * Processes an array of items in batches to prevent UI freezing
 * @param items Array of items to process
 * @param processFn Function that processes a single item
 * @param options Configuration options for batch processing
 * @returns Promise that resolves when all items are processed
 */
export async function processBatches<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (processedCount: number, totalCount: number) => void;
    onError?: (error: Error, item: T) => void;
  } = {}
): Promise<R[]> {
  const { 
    batchSize = 5, 
    delayMs = 100,
    onProgress = () => {},
    onError = () => {}
  } = options;
  
  const results: R[] = [];
  let processedCount = 0;
  const totalCount = items.length;
  
  // Process items in batches
  for (let i = 0; i < totalCount; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process all items in the current batch concurrently
    const batchPromises = batch.map(async (item) => {
      try {
        // Process the item
        const result = await processFn(item);
        
        // Track progress and results
        processedCount++;
        onProgress(processedCount, totalCount);
        
        return result;
      } catch (error) {
        // Handle errors without stopping the batch
        console.error('Error processing item in batch:', error);
        onError(error as Error, item);
        
        // Still count this item as processed for progress tracking
        processedCount++;
        onProgress(processedCount, totalCount);
        
        // Return null for failed items
        return null as unknown as R;
      }
    });
    
    // Wait for all items in the batch to be processed
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a delay between batches to prevent UI freezing
    if (i + batchSize < totalCount) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
