import axios from 'axios';

class JoplinAPIClient {
  constructor({ port = 41184, token }) {
    this.baseURL = `http://127.0.0.1:${port}`;
    this.token = token;
  }

  async serviceAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/ping`);
      return response.status === 200 && response.data === 'JoplinClipperServer';
    } catch (error) {
      process.stderr.write(`Error checking Joplin service availability: ${error}\n`);
      return false;
    }
  }

  async getAllItems(path, options = {}) {
    let page = 1;
    const items = [];

    try {
      while (true) {
        const response = await this.get(path, this.mergeRequestOptions(options, { query: { page } }));

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
      process.stderr.write(`Error in getAllItems for path ${path}: ${error}\n`);
      throw error;
    }
  }

  async get(path, options = {}) {
    try {
      const { data } = await axios.get(
        `${this.baseURL}${path}`,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      process.stderr.write(`Error in GET request for path ${path}: ${error}\n`);
      throw error;
    }
  }

  async post(path, body, options = {}) {
    try {
      const { data } = await axios.post(
        `${this.baseURL}${path}`,
        body,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      process.stderr.write(`Error in POST request for path ${path}: ${error}\n`);
      throw error;
    }
  }

  async delete(path, options = {}) {
    try {
      const { data } = await axios.delete(
        `${this.baseURL}${path}`,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      process.stderr.write(`Error in DELETE request for path ${path}: ${error}\n`);
      throw error;
    }
  }

  async put(path, body, options = {}) {
    try {
      const { data } = await axios.put(
        `${this.baseURL}${path}`,
        body,
        {
          params: this.requestOptions(options).query
        }
      );
      return data;
    } catch (error) {
      process.stderr.write(`Error in PUT request for path ${path}: ${error}\n`);
      throw error;
    }
  }

  requestOptions(options = {}) {
    return this.mergeRequestOptions(
      {
        query: { token: this.token }
      },
      options
    );
  }

  mergeRequestOptions(options1, options2) {
    return {
      query: {
        ...(options1.query || {}),
        ...(options2.query || {})
      },
      ...this.except(options1, 'query'),
      ...this.except(options2, 'query')
    };
  }

  except(obj, key) {
    const result = { ...obj };
    delete result[key];
    return result;
  }
}

export default JoplinAPIClient;
