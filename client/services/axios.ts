import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error);
  },
);
