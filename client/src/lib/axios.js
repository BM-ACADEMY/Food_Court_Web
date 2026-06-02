import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { toast } from 'react-toastify';

// Configure NProgress styling and behavior
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });

// Create a custom axios instance (optional but recommended for global config)
// You can also just intercept the global axios object if preferred.
// Here we intercept the global axios since the app imports axios directly everywhere.
let activeRequests = 0;

const handleRequestStart = (config) => {
  if (activeRequests === 0) {
    NProgress.start();
  }
  activeRequests++;
  return config;
};

const handleRequestError = (error) => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    NProgress.done();
  }
  return Promise.reject(error);
};

const handleResponseSuccess = (response) => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    NProgress.done();
  }
  return response;
};

const handleResponseError = (error) => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    NProgress.done();
  }
  
  // Globally handle network errors or timeouts to prevent white screen of death
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.message.includes('timeout')) {
    toast.error('Network error or timeout. Please check your connection and try again.', {
      position: 'top-center',
      autoClose: 4000
    });
  } else if (error.response && error.response.status >= 500) {
    toast.error('Server error. Please try again later.', {
      position: 'top-center',
      autoClose: 4000
    });
  }

  return Promise.reject(error);
};

// Apply interceptors to the global axios object
axios.interceptors.request.use(handleRequestStart, handleRequestError);
axios.interceptors.response.use(handleResponseSuccess, handleResponseError);

// Add a global timeout (e.g., 10 seconds) so requests don't hang indefinitely
axios.defaults.timeout = 10000;

export default axios;
