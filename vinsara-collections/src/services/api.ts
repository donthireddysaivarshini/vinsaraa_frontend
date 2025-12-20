import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    console.log('🔐 Request interceptor - Token in localStorage:', token ? 'YES (length: ' + token.length + ')' : 'NO');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Added Authorization header');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const resp = error?.response;

    if (resp && resp.status === 401) {
      console.error('❌ Got 401 Unauthorized response');
      console.error('Response data:', resp.data);
      localStorage.removeItem('userToken');
      
      const isAlreadyOnLogin = window.location.pathname === '/login';
      console.log('Currently on /login?', isAlreadyOnLogin);
      
      if (!isAlreadyOnLogin) {
        console.log('Redirecting to login...');
        // Use a small delay to ensure cleanup
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    }

    return Promise.reject(resp ? resp.data : error);
  }
);

export const authService = {
  login: async (credentials: any) => {
    console.log('📤 Calling login endpoint...');
    const response = await api.post('/auth/login/', credentials);
    console.log('📥 Login response:', response.data);
    return response.data;
  },

  signup: async (userData: any) => {
    console.log('📤 Calling signup endpoint...');
    const response = await api.post('/auth/signup/', userData);
    console.log('📥 Signup response:', response.data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/user/');
    return response.data;
  },

  googleLogin: async (googleData: any) => {
    console.log('📤 Calling Google login with code:', googleData.code.substring(0, 20) + '...');
    const payload = {
      code: googleData.code,
      callback_url: "postmessage"
    };
    const response = await api.post('/auth/google/', payload);
    console.log('📥 Google login response:', response.data);
    return response.data;
  },

  getSavedAddresses: async () => {
    const response = await api.get('/auth/addresses/');
    return response.data;
  },

  saveAddress: async (address: any) => {
    const response = await api.post('/auth/addresses/', address);
    return response.data;
  },

  updateAddress: async (id: number, data: any) => {
    const response = await api.patch(`/auth/addresses/${id}/`, data);
    return response.data;
  },

  deleteAddress: async (id: number) => {
    const response = await api.delete(`/auth/addresses/${id}/`);
    return response.data;
  },

  setDefaultAddress: async (id: number) => {
    const response = await api.post(`/auth/addresses/${id}/set-default/`);
    return response.data;
  },
};

export const storeService = {
  getProducts: async (params?: { category?: string; is_new?: boolean }) => {
    const response = await api.get('/store/products/', { params });
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await api.get(`/store/products/${slug}/`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/store/categories/');
    return response.data;
  },

  validateCoupon: async (code: string, orderTotal: number) => {
    const response = await api.post('/store/validate-coupon/', {
      code,
      order_total: orderTotal
    });
    return response.data;
  },

  getSiteConfig: async () => {
    const response = await api.get('/store/config/');
    return response.data;
  }
};

export const orderService = {
  createOrder: async (data: any) => {
    const response = await api.post('/orders/checkout/', data);
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/payments/verify/', data);
    return response.data;
  },

  getOrderDetails: async (orderId: string | number) => {
    const response = await api.get(`/orders/${orderId}/status/`);
    return response.data;
  },

  getUserOrders: async () => {
    console.log('📤 Fetching user orders...');
    const response = await api.get('/orders/');
    console.log('📥 Orders response:', response.data);
    return response.data;
  },

  updateOrderStatus: async (orderId: number, newStatus: string) => {
    const response = await api.patch(`/orders/${orderId}/update-status/`, { 
      order_status: newStatus 
    });
    return response.data;
  }
};

export const { getUserOrders, getOrderDetails, updateOrderStatus } = orderService;