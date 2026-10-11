import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';


// 0. تسجيل الدخول
export const verifySuperAdmin = createAsyncThunk(
  'users/verifySuperAdmin',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/verify-superadmin/', {
        username,
        password,
      });

      //  حفظ التوكن
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'بيانات الدخول غير صحيحة'
      );
    }
  }
);

// 1. جلب المستخدمين
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/get_users/');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'فشل جلب المستخدمين'
      );
    }
  }
);

// 2. التحقق الدوري
export const verifyMe = createAsyncThunk(
  'users/verifyMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/verify-me/');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'انتهت الجلسة'
      );
    }
  }
);

// 3. إضافة مستخدم
export const addUser = createAsyncThunk(
  'users/add',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/add_user/', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'فشل إضافة المستخدم');
    }
  }
);

// 4. حذف مستخدم
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/delete_user/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'فشل حذف المستخدم'
      );
    }
  }
);

//  Slice
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    isLoading: false,
    error: null,
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    //  تسجيل الخروج
    logout: (state) => {
      state.currentUser = null;
      state.users = [];
      state.error = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  },
  extraReducers: (builder) => {
    builder
      //  Verify SuperAdmin
      .addCase(verifySuperAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifySuperAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        //  حفظ المستخدم الحالي
        const user = {
          username: action.payload.username,
          role: action.payload.role,
        };
        state.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
      .addCase(verifySuperAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      //  Verify Me
      .addCase(verifyMe.fulfilled, (state, action) => {
        const user = {
          username: action.payload.username,
          role: action.payload.role,
        };
        state.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
      .addCase(verifyMe.rejected, (state) => {
        //  المستخدم محذوف أو التوكن غير صالح → اطرده
        state.currentUser = null;
        state.users = [];
        state.error = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })

      //  Fetch
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      //  Add
      .addCase(addUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.error = action.payload;
      })

      //  Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, logout } = usersSlice.actions;
export default usersSlice.reducer;