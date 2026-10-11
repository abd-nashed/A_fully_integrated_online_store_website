import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

//  1. إضافة التوكن تلقائيًا لكل طلب
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//  2. تجديد التوكن تلقائيًا عند 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // لو 401 ولم نجرّب التجديد بعد
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('لا يوجد refresh token');

        // اطلب access جديد
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/token/refresh/`,
          { refresh }
        );

        // احفظ الجديد
        localStorage.setItem('access_token', data.access);

        // أعد الطلب الأصلي
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // فشل التجديد  اطرد المستخدم
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
