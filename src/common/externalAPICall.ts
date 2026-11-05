import axios, { Method } from 'axios';
import https from 'https';

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export const externalAPICall = async (method: Method = "POST", url: string, token: string, requestBody?: any): Promise<any> => {
  try {
    const config: any = {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    };

    if (method === 'POST' || method === 'PUT') {
      config.data = requestBody;
    }

    const response = await axiosInstance.request({
      method,
      url,
      ...config,
    });

    return response.data;
  } catch (err) {
    return `ERROR: ${err}`;
  }
};
