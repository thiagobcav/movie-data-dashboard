
/**
 * Processes items in batches to prevent UI freeze
 * @param items Array of items to process
 * @param processFn Function to process each item
 * @param batchSize Number of items per batch
 * @param delayMs Delay between batches in milliseconds
 * @param onProgress Callback for progress updates
 * @param onComplete Callback when all batches are complete
 */
export async function processBatches<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (processedCount: number, totalCount: number, results: R[]) => void;
    onBatchComplete?: (batchResults: R[], batchIndex: number) => void;
    onComplete?: (results: R[]) => void;
    onError?: (error: Error, item: T, itemIndex: number) => void;
  }
): Promise<R[]> {
  const {
    batchSize = 5,
    delayMs = 300,
    onProgress,
    onBatchComplete,
    onComplete,
    onError
  } = options;
  
  const totalItems = items.length;
  const results: R[] = [];
  let processedCount = 0;
  
  // Process items in batches
  for (let i = 0; i < totalItems; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults: R[] = [];
    
    // Process this batch concurrently
    await Promise.all(
      batch.map(async (item, batchItemIndex) => {
        try {
          const result = await processFn(item);
          batchResults.push(result);
          return result;
        } catch (error) {
          if (onError) {
            onError(error as Error, item, i + batchItemIndex);
          }
          return null;
        }
      })
    );
    
    // Filter out nulls from errors
    const validResults = batchResults.filter(r => r !== null) as R[];
    
    // Add batch results to overall results
    results.push(...validResults);
    
    // Update progress
    processedCount += batch.length;
    if (onProgress) {
      onProgress(processedCount, totalItems, results);
    }
    
    // Notify batch completion
    if (onBatchComplete) {
      onBatchComplete(validResults, i / batchSize);
    }
    
    // Add delay between batches to prevent UI freeze
    if (i + batchSize < totalItems && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Call complete callback
  if (onComplete) {
    onComplete(results);
  }
  
  return results;
}

/**
 * Processes a queue of items with controlled concurrency
 */
export class ProcessQueue<T, R> {
  private queue: T[] = [];
  private processing = false;
  private results: R[] = [];
  private errors: Error[] = [];
  private processedCount = 0;
  private concurrency: number;
  private processFn: (item: T) => Promise<R>;
  private onProgress?: (processedCount: number, totalCount: number, results: R[]) => void;
  private onComplete?: (results: R[], errors: Error[]) => void;
  private onError?: (error: Error, item: T) => void;
  
  constructor(options: {
    items?: T[];
    processFn: (item: T) => Promise<R>;
    concurrency?: number;
    onProgress?: (processedCount: number, totalCount: number, results: R[]) => void;
    onComplete?: (results: R[], errors: Error[]) => void;
    onError?: (error: Error, item: T) => void;
  }) {
    this.queue = options.items || [];
    this.processFn = options.processFn;
    this.concurrency = options.concurrency || 3;
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }
  
  public addItem(item: T): void {
    this.queue.push(item);
  }
  
  public addItems(items: T[]): void {
    this.queue.push(...items);
  }
  
  public getQueueLength(): number {
    return this.queue.length;
  }
  
  public getProcessedCount(): number {
    return this.processedCount;
  }
  
  public getResults(): R[] {
    return [...this.results];
  }
  
  public getErrors(): Error[] {
    return [...this.errors];
  }
  
  public isProcessing(): boolean {
    return this.processing;
  }
  
  public async process(): Promise<R[]> {
    if (this.processing) {
      return this.results;
    }
    
    this.processing = true;
    const totalItems = this.queue.length;
    
    try {
      // Process items with controlled concurrency
      const activePromises = new Set<Promise<void>>();
      
      while (this.queue.length > 0) {
        // Wait if we've reached max concurrency
        if (activePromises.size >= this.concurrency) {
          await Promise.race(activePromises);
        }
        
        // Process next item
        const item = this.queue.shift();
        if (!item) continue;
        
        const promise = (async () => {
          try {
            const result = await this.processFn(item);
            this.results.push(result);
          } catch (error) {
            this.errors.push(error as Error);
            if (this.onError) {
              this.onError(error as Error, item);
            }
          } finally {
            this.processedCount++;
            if (this.onProgress) {
              this.onProgress(this.processedCount, totalItems, this.results);
            }
            activePromises.delete(promise);
          }
        })();
        
        activePromises.add(promise);
      }
      
      // Wait for any remaining promises
      await Promise.all(activePromises);
      
    } finally {
      this.processing = false;
      if (this.onComplete) {
        this.onComplete(this.results, this.errors);
      }
    }
    
    return this.results;
  }
  
  public reset(): void {
    this.queue = [];
    this.results = [];
    this.errors = [];
    this.processedCount = 0;
    this.processing = false;
  }
}
