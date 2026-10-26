import axios from "axios";

const instance = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://flight-management-zn5w.onrender.com",
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user storage
      localStorage.removeItem("token");
      localStorage.removeItem("firstName");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("passengerId");

      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/signup"
      ) {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
