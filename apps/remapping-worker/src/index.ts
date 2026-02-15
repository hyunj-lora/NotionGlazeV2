import { Redis } from 'ioredis';
import { NotionService, RemapperService } from '@notionglaze/core';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

/**
 * Main Job Loop
 */
async function startWorker() {
    console.log('🚀 Remapping Worker is listening for jobs...');

    while (true) {
        try {
            // Wait for a job from the list
            // BRPOP returns [key, value]
            const result = await redis.brpop('notion-remapping-queue', 0);
            if (!result) continue;

            const jobData = JSON.parse(result[1]);
            const { sourceId, targetParentId, accessToken, txId, tenantId } = jobData;

            console.log(`[Job] Processing move for ${sourceId} to ${targetParentId}. TX: ${txId}`);

            const notion = new NotionService(accessToken);
            const remapper = new RemapperService(notion);

            const { idMap } = await remapper.moveBlockAndRemap(sourceId, targetParentId);

            console.log(`[Job] Success. Generated ${Object.keys(idMap).length} mappings.`);

            // TODO: Notify frontend
            // You can push back to another Redis list that the API route or a separate socket server polls
            await redis.lpush(`completion-queue:${txId}`, JSON.stringify({ idMap, status: 'success' }));

        } catch (error: any) {
            console.error(`[Job Error]`, error.message);
            // Fallback: Potential retry logic or error reporting
        }
    }
}

startWorker();
