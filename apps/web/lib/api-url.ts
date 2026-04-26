export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
};

export const API_URL = getApiUrl();