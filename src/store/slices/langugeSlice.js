import { createSlice } from '@reduxjs/toolkit';

const langSlice = createSlice({
  name: 'lang',
  initialState: {
   lang : localStorage.getItem('lang') || 'ar'
  },
  reducers: {
   edit: (state,action)=>{
       state.lang = state.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('lang', state.lang);
   }
  },

});

export const { edit } = langSlice.actions;
export default langSlice.reducer;