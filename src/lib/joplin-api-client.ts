import axios from 'axios';
import { ApiClientOptions, JoplinPaginatedResponse, RequestOptions } from '../types/index.js';

class JoplinAPIClient {
  private baseURL: string;
  private token: string;

  constructor({ port = 41184, token }: ApiClientOptions) {
    this.baseURL = `http://127.0.0.1:${port}`;
    this.token = token;
  }

  async serviceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/ping`);
      return response.status === 200 && response.data === 'JoplinClipperServer';
    } catch (error) {
      process.stderr.write(`Error checking Joplin service availability: ${error}\n`);
      return false;
    }
  }

  async getAllItems<T>(path: string, options: RequestOptions = {}): Promise<T[]> {
    let page = 1;
    const items: T[] = [];

    try {
      while (true) {
        const response = await this.get<JoplinPaginatedResponse<T>>(
          path, 
          this.mergeRequestOptions(options, { query: { page } })
        );

        // Validate response format
        if (!response || typeof response !== 'object' || !Array.isArray(response.items)) {
          throw new Error(`Unexpected response format from Joplin API for path: ${path}`);
        }

        items.push(...response.items);
        page += 1;

        if (!response.has_more) break;
      }

      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error in getAllItems for path ${path}: ${errorMessage}\n`);
      throw error;
    }
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    try {
      const { data } = await axios.get<T>(
        `${this.baseURL}${path}`,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error in GET request for path ${path}: ${errorMessage}\n`);
      throw error;
    }
  }

  async post<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    try {
      const { data } = await axios.post<T>(
        `${this.baseURL}${path}`,
        body,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error in POST request for path ${path}: ${errorMessage}\n`);
      throw error;
    }
  }

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    try {
      const { data } = await axios.delete<T>(
        `${this.baseURL}${path}`,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error in DELETE request for path ${path}: ${errorMessage}\n`);
      throw error;
    }
  }

  async put<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    try {
      const { data } = await axios.put<T>(
        `${this.baseURL}${path}`,
        body,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error in PUT request for path ${path}: ${errorMessage}\n`);
      throw error;
    }
  }

  private requestOptions(options: RequestOptions = {}): RequestOptions {
    return this.mergeRequestOptions(
      {
        query: { token: this.token }
      },
      options
    );
  }

  private mergeRequestOptions(options1: RequestOptions, options2: RequestOptions): RequestOptions {
    return {
      query: {
        ...(options1.query || {}),
        ...(options2.query || {})
      },
      ...this.except(options1, 'query'),
      ...this.except(options2, 'query')
    };
  }

  private except(obj: Record<string, unknown>, key: string): Record<string, unknown> {
    const result = { ...obj };
    delete result[key];
    return result;
  }
}

export default JoplinAPIClient;
