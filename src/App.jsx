import HeaderHome from '../src/component/headers/HeaderHome'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Admin from '../src/dashboard/Admin'
import Login from './pages/Login'
import ProtectedRoute from './component/ProtectedRoute'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useLayoutEffect } from 'react'
import { verifyMe } from './store/slices/usersSlice'
import Categories from './pages/Categories'
import ProductsByCategory from './pages/ProductsByCategory'
import ProductDetail from './pages/ProductDetail'
import Offers from './pages/Offers'
import Contact from './pages/Contact'
import Messages from './pages/Messages'
import Stores from './pages/Stores'
import StoreDetail from './pages/StoreDetail'
import Cart from './pages/Cart'
import AdminOrders from './pages/AdminOrders'
import TrackOrder from './pages/TrackOrder'

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.users.currentUser);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  //  التحقق الدوري من المستخدم
  useEffect(() => {
    if (!currentUser) return;

    dispatch(verifyMe());

    const interval = setInterval(() => {
      dispatch(verifyMe());
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser, dispatch]);

  return (
    <>
      <HeaderHome />
      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:categoryId/products" element={<ProductsByCategory />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/messages" element={<Messages />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/stores/:storeId" element={<StoreDetail />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App