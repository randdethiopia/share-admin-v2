import axios from 'axios'

export default function AxiosConfig(token: string | null, signOut: () => void, role: string) {
  const url = "https://api.share.com.et"
  axios.defaults.baseURL = url
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response.status === 403) {
        signOut()
      }
      return Promise.reject(error);
    }
  );
  axios.defaults.headers.common['Authorization'] = ('Bearer ' + token) as string
  axios.defaults.headers.common['role'] = (role) as string
  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*'
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'Noooooo'
  axios.defaults.headers.common['Content-Type'] = 'application/json'
}
