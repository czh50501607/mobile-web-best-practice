import axios, { AxiosRequestConfig } from 'axios';

interface ResponseData<T> {
  data: T;
  errmsg: string;
  errno: number;
}

function errorReport(
  url: string,
  error: string | Error,
  requestOptions: AxiosRequestConfig,
  response?: AnyObject
) {
  if (window.$sentry) {
    const errorInfo: RequestErrorInfo = {
      error: typeof error === 'string' ? new Error(error) : error,
      type: 'request',
      requestUrl: url,
      requestOptions: JSON.stringify(requestOptions)
    };

    if (response) {
      errorInfo.response = JSON.stringify(response);
    }

    window.$sentry.log(errorInfo);
  }
}

const DEFAULT_OPTIONS = {
  baseURL: '',
  timeout: 30 * 1000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
};

const instance = axios.create(DEFAULT_OPTIONS);

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (thrown) => {
    return Promise.reject(thrown);
  }
);

// 封装 axios
export default async function<T = any>(
  options: AxiosRequestConfig
): Promise<ResponseData<T>> {
  const { url } = options;
  const requestOptions = Object.assign({}, options, {
    method: 'post',
    url
  });

  try {
    const {
      data,
      data: { errno, errmsg }
    } = await instance.request<ResponseData<T>>(requestOptions);
    if (errno) {
      errorReport(url!, errmsg, requestOptions, data);
      throw new Error(errmsg);
    }

    return data;
  } catch (err) {
    errorReport(url!, err, requestOptions);
    throw err;
  }
}
