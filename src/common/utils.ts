import { Collection, ObjectId, SortDirection } from 'mongodb';
import {
  CursorPaginatedResponse,
  LimitOffsetPaginatedReponse,
} from './@types/nest.types';
import * as crypto from 'node:crypto';

export async function getCursorPaginatedResponse<T = any>(
  collection: Collection<any>,
  filter: Record<string, any>,
  projection: Record<string, any>,
  sortField: string,
  sortType: SortDirection,
  pageSize: number,
  before?: string,
  after?: string,
): Promise<CursorPaginatedResponse<T>> {
  let results;
  let next: ObjectId;
  let prev: ObjectId;
  const itemsPerPage = pageSize + 1;
  const sort = {
    [sortField]: sortType,
  };

  if (before) {
    if (sortType === 1) {
      results = await collection
        .find(
          { ...filter, _id: { $lt: new ObjectId(before) } },
          { projection, limit: itemsPerPage, sort },
        )
        .toArray();
    } else {
      results = await collection
        .find(
          { ...filter, _id: { $gt: new ObjectId(before) } },
          { projection, limit: itemsPerPage, sort },
        )
        .toArray();
    }
    if (results.length === itemsPerPage) {
      prev = results[1]._id;
      results = results.slice(1);
    }
    next = results[results.length - 1]._id;
  }

  if (after) {
    if (sortType === 1) {
      results = await collection
        .find(
          { ...filter, _id: { $gt: new ObjectId(after) } },
          { projection, limit: itemsPerPage, sort },
        )
        .toArray();
    } else {
      results = await collection
        .find(
          { ...filter, _id: { $lt: new ObjectId(after) } },
          { projection, limit: itemsPerPage, sort },
        )
        .toArray();
    }
    if (results.length === itemsPerPage) {
      next = results[results.length - 2]._id;
      results = results.slice(0, -1);
    }
    prev = results[0]._id;
  }

  if (!before && !after) {
    results = await collection
      .find({ ...filter }, { projection, limit: itemsPerPage, sort })
      .toArray();
    if (results.length === itemsPerPage) {
      next = results[results.length - 2]._id;
      results = results.slice(0, -1);
    }
  }

  const count = await collection.countDocuments(filter);

  const response: CursorPaginatedResponse<T> = {
    results,
    count,
    before: prev?.toHexString(),
    after: next?.toHexString(),
  };

  return response;
}

export async function getLimitOffsetPaginatedResponse<T = any>(
  collection: Collection<any>,
  filter: Record<string, any>,
  projection: Record<string, any>,
  sortField: string,
  sortType: SortDirection,
  pageSize: number,
  page?: number,
): Promise<LimitOffsetPaginatedReponse<T>> {
  const sort = {
    [sortField]: sortType,
  };

  const [results, count] = await Promise.all([
    collection
      .find(filter, {
        projection,
        limit: pageSize,
        skip: (page - 1) * pageSize,
        sort,
      })
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    results,
    pages: Math.ceil(count / pageSize),
  };
}

function waitFor(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retry(
  promise: () => Promise<any>,
  onRetry: () => void,
  maxRetries: number,
  initialDelay = 100,
) {
  
  
  
  async function retryWithBackoff(retries) {
    try {
      
      if (retries > 0) {
        
        
        
        
        
        
        const timeToWait = 2 ** retries * initialDelay;
        console.log(`waiting for ${timeToWait}ms...`);
        await waitFor(timeToWait);
      }
      return await promise();
    } catch (e) {
      
      
      if (retries < maxRetries) {
        onRetry?.();
        return retryWithBackoff(retries + 1);
      } else {
        console.warn('Max retries reached. Bubbling the error up');
        throw e;
      }
    }
  }

  return retryWithBackoff(0);
}

function encryptData(data: string, key: string) {
  const keyBuf = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(16); 
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ]);
  return {
    encryptedData: encryptedBuffer.toString('hex'),
    iv: iv.toString('hex'),
  };
}

function decryptData(encryptedData: string, key: string, iv: string) {
  const keyBuf = Buffer.from(key, 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    keyBuf,
    Buffer.from(iv, 'hex'),
  );
  const decryptedBuffer = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final(),
  ]);
  return decryptedBuffer.toString('utf8');
}

export { retry as retryWithBackoff, encryptData, decryptData };
