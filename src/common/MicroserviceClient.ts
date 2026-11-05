import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class MicroserviceClient {
  private baseURL: string;
  private endpoint: string;
  private client: AxiosInstance;

  constructor(baseURL: string, endpoint: string) {
    this.baseURL = baseURL;
    this.endpoint = endpoint;
    this.client = axios.create({
      baseURL: this.baseURL,
    });
  }

  private getFullURL(): string {
    return `${this.baseURL}${this.endpoint}`;
  }

  public async get<T>(config?: AxiosRequestConfig): Promise<AxiosResponse<T> | undefined> {
    try {
      const response = await this.client.get<T>(this.getFullURL(), config);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async post<T>(data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | undefined> {
    try {
      const response = await this.client.post<T>(this.getFullURL(), data, config);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async put<T>(data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | undefined> {
    try {
      const response = await this.client.put<T>(this.getFullURL(), data, config);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async delete<T>(config?: AxiosRequestConfig): Promise<AxiosResponse<T> | undefined> {
    try {
      const response = await this.client.delete<T>(this.getFullURL(), config);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      throw error;
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

export default MicroserviceClient;
