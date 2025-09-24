
/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_RATE_LIMITER
COLOR_ONION_HEX: NEON=#F97316 FLUO=#EA580C PASTEL=#FED7AA
ICON_FAMILY: lucide
ICON_GLYPH: timer
ICON_SIG: AL005005
5WH: WHAT=Rate limiting and throttling utilities; WHY=API protection and resource management; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\utils\rateLimiter.ts; WHEN=2025-09-22; HOW=TypeScript class with token bucket algorithm
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/


type AsyncTask<T> = () => Promise<T>;

class RateLimiter {
    private queue: { task: AsyncTask<any>; resolve: (value: any) => void; reject: (reason?: any) => void; }[] = [];
    private isProcessing = false;
    private intervalMs: number;

    constructor(intervalMs: number) {
        this.intervalMs = intervalMs;
    }

    /**
     * Schedules a task to be executed. The task is added to a queue and will be
     * executed after the specified interval has passed since the last task finished.
     * @param task The async function to execute.
     * @returns A promise that resolves or rejects with the result of the task.
     */
    public schedule<T>(task: AsyncTask<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            // If the queue is not currently being processed, start processing.
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        // If the queue is empty, stop processing.
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { task, resolve, reject } = this.queue.shift()!;

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            // Wait for the interval before allowing the next item to be processed.
            setTimeout(() => {
                // Recursively call processQueue to handle the next item.
                this.isProcessing = false;
                this.processQueue();
            }, this.intervalMs);
        }
    }
}

// Initialize a single limiter for the Gemini API.
// A 20-second delay (3 requests per minute) is a very safe value to avoid hitting
// free-tier limits for the image generation API, which is more restrictive than the text API.
export const geminiApiLimiter = new RateLimiter(20000);