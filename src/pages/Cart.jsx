import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../store/slices/cartSlice";
import { createOrder, clearOrdersError } from "../store/slices/ordersSlice";
import "../styles/Cart.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items } = useSelector((state) => state.cart);
  const { isCreating } = useSelector((state) => state.orders);
  const currentUser = useSelector((state) => state.users.currentUser);
  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const canViewOrders = ["superadmin", "admin", "sales", "store"].includes(
    currentUser?.role
  );

  //  الحالات
  const [checkoutDialog, setCheckoutDialog] = useState({
    isOpen: false,
    full_name: "",
    phone: "",
    address: "",
  });

  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    tracking_code: "",
    order_id: null,
  });

  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  حالة نافذة نسخ الكود
  const [copyDialog, setCopyDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  حالة نافذة تأكيد إلغاء الكل
  const [clearCartDialog, setClearCartDialog] = useState({
    isOpen: false,
  });

  //  الحسابات
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  //  حذف منتج
  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  //  تعديل الكمية
  const handleQuantityChange = (id, newQuantity) => {
    dispatch(updateQuantity({ id, quantity: newQuantity }));
  };

  //  فتح Dialog إلغاء الكل
  const openClearCartDialog = () => {
    setClearCartDialog({ isOpen: true });
  };

  //  تأكيد إلغاء الكل
  const confirmClearCart = () => {
    dispatch(clearCart());
    setClearCartDialog({ isOpen: false });
  };

  //  فتح Dialog الشراء
  const openCheckoutDialog = () => {
    dispatch(clearOrdersError());
    setCheckoutDialog({
      isOpen: true,
      full_name: "",
      phone: "",
      address: "",
    });
  };

  const closeCheckoutDialog = () => {
    setCheckoutDialog({
      isOpen: false,
      full_name: "",
      phone: "",
      address: "",
    });
  };

  //  إتمام الشراء
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!checkoutDialog.full_name.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال اسمك") });
      return;
    }
    if (!checkoutDialog.phone.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال رقم هاتفك") });
      return;
    }
    if (!checkoutDialog.address.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال عنوانك") });
      return;
    }

    const orderItems = items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      product_price: Number(item.price),
      store_name: item.store_name || "",
      quantity: item.quantity,
    }));

    const result = await dispatch(
      createOrder({
        full_name: checkoutDialog.full_name,
        phone: checkoutDialog.phone,
        address: checkoutDialog.address,
        items: orderItems,
      })
    );

    if (createOrder.fulfilled.match(result)) {
      closeCheckoutDialog();
      setSuccessDialog({
        isOpen: true,
        tracking_code: result.payload.tracking_code,
        order_id: result.payload.id,
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message:
          typeof result.payload === "string"
            ? result.payload
            : t("فشل إنشاء الطلب. تحقق من البيانات."),
      });
    }
  };

  //  نسخ كود التتبع
  const handleCopyCode = () => {
    navigator.clipboard.writeText(successDialog.tracking_code);
    setCopyDialog({ isOpen: true, message: t("تم نسخ الكود بنجاح") });
  };

  //  إغلاق Dialog النجاح
  const handleSuccessClose = () => {
    dispatch(clearCart());
    setSuccessDialog({ isOpen: false, tracking_code: "", order_id: null });
    navigate("/");
  };

  //  السلة فاضية
  if (items.length === 0) {
    return (
      <div
        className="cart-page"
        style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
      >
        {canViewOrders && (
          <div className="cart-header">
            <div>
              <h1 className="cart-title">🛒 {t("السلة")}</h1>
            </div>
            <Link to="/admin/orders" className="cart-orders-btn">
              📋 {t("رؤية الطلبات")}
            </Link>
          </div>
        )}

        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>{t("السلة فارغة")}</h2>
          <p>{t("ابدأ بإضافة منتجات للسلة")}</p>
          <Link to="/categories" className="cart-empty-btn">
            🛍️ {t("تصفّح الأقسام")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cart-page"
      style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="cart-header">
        <div>
          <h1 className="cart-title">
            🛒 {t("السلة")}
            <span className="cart-badge">{totalItems}</span>
          </h1>
          <p className="cart-subtitle">
            {t("راجع منتجاتك قبل إتمام الشراء")}
          </p>
        </div>

        {canViewOrders && (
          <Link to="/admin/orders" className="cart-orders-btn">
            📋 {t("رؤية الطلبات")}
          </Link>
        )}
      </div>

      <div className="cart-container">
        {/*  المنتجات  */}
        <div className="cart-items">
          {items.map((item) => {
            const imageSrc = item.image?.startsWith("http")
              ? item.image
              : `${API_URL}${item.image}`;

            return (
              <div key={item.id} className="cart-item">
                <Link to={`/products/${item.id}`} className="cart-item-image">
                  <img src={imageSrc} alt={item.name} />
                </Link>

                <div className="cart-item-info">
                  <Link
                    to={`/products/${item.id}`}
                    className="cart-item-name"
                  >
                    {item.name}
                  </Link>
                  <span className="cart-item-price">${item.price}</span>
                  {item.stock <= 5 && item.stock > 0 && (
                    <span className="cart-item-stock-warning">
                      ⚠️ {t("متبقي فقط")} {item.stock}
                    </span>
                  )}
                </div>

                <div className="cart-item-quantity">
                  <button
                    className="cart-qty-btn"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button
                    className="cart-qty-btn"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>

                <button
                  className="cart-item-remove"
                  onClick={() => handleRemove(item.id)}
                  title={t("حذف")}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/*  ملخص السلة  */}
        <div className="cart-summary">
          <h2 className="cart-summary-title">{t("ملخص السلة")}</h2>

          <div className="cart-summary-row">
            <span>{t("عدد المنتجات")}</span>
            <span>{totalItems}</span>
          </div>

          <div className="cart-summary-row">
            <span>{t("المجموع الفرعي")}</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="cart-summary-divider"></div>

          <div className="cart-summary-row cart-summary-total">
            <span>{t("الإجمالي")}</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="cart-summary-actions">
            <button
              className="cart-btn cart-btn-cancel"
              onClick={openClearCartDialog}
            >
              ❌ {t("إلغاء الكل")}
            </button>
            <button
              className="cart-btn cart-btn-checkout"
              onClick={openCheckoutDialog}
            >
              ✅ {t("إتمام الشراء")}
            </button>
          </div>
        </div>
      </div>

      {/*  Dialog الشراء  */}
      {checkoutDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog dialog-form">
            <div className="dialog-header">
              <h3 className="dialog-title">📝 {t("معلومات الطلب")}</h3>
              <button className="dialog-close" onClick={closeCheckoutDialog}>
                ✕
              </button>
            </div>

            <form className="dialog-form-body" onSubmit={handleCheckout}>
              <div className="form-hint dialog-info-box">
                ℹ️ {t("أدخل بياناتك وسنتواصل معك لتأكيد الطلب")}
              </div>

              <div className="form-group">
                <label className="form-label">{t("الاسم الكامل")} *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("أدخل اسمك الكامل")}
                  value={checkoutDialog.full_name}
                  onChange={(e) =>
                    setCheckoutDialog({
                      ...checkoutDialog,
                      full_name: e.target.value,
                    })
                  }
                  autoFocus
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("رقم الهاتف")} *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="09XXXXXXXX"
                  value={checkoutDialog.phone}
                  onChange={(e) =>
                    setCheckoutDialog({
                      ...checkoutDialog,
                      phone: e.target.value,
                    })
                  }
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("العنوان / الموقع")} *</label>
                <textarea
                  className="form-textarea"
                  placeholder={t("المدينة، الحي، الشارع، ...")}
                  value={checkoutDialog.address}
                  onChange={(e) =>
                    setCheckoutDialog({
                      ...checkoutDialog,
                      address: e.target.value,
                    })
                  }
                  rows={3}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="dialog-btn dialog-btn-cancel"
                  onClick={closeCheckoutDialog}
                  disabled={isCreating}
                >
                  {t("إلغاء")}
                </button>
                <button
                  type="submit"
                  className="dialog-btn dialog-btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? t("جاري الإرسال...") : `✅ ${t("تأكيد الطلب")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Dialog النجاح  */}
      {successDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-success">🎉</div>
            <h3 className="dialog-title">{t("تم الشراء بنجاح")}</h3>

            <p className="dialog-message">
              {t("سوف يصلك إشعار أو اتصال لتأكيد الاستلام في أقرب وقت.")}
            </p>

            <div className="cart-tracking-box">
              <span className="cart-tracking-label">
                🔍 {t("كود تتبع طلبك")}
              </span>
              <div className="cart-tracking-code">
                <span>{successDialog.tracking_code}</span>
                <button
                  className="cart-tracking-copy"
                  onClick={handleCopyCode}
                  title={t("نسخ")}
                >
                  📋
                </button>
              </div>
              <span className="cart-tracking-hint">
                💡 {t("احتفظ بهذا الكود لتتبع طلبك")}
              </span>
            </div>

            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={handleSuccessClose}
                autoFocus
              >
                {t("العودة للرئيسية")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Dialog نسخ الكود */}
      {copyDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-success">📋</div>
            <h3 className="dialog-title">{t("تم النسخ")}</h3>
            <p className="dialog-message">{copyDialog.message}</p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={() => setCopyDialog({ isOpen: false, message: "" })}
                autoFocus
              >
                {t("حسناً")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Dialog تأكيد إلغاء الكل */}
      {clearCartDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">{t("تأكيد إلغاء الكل")}</h3>
            <p className="dialog-message">
              {t("هل أنت متأكد من إلغاء كل المنتجات؟")}
              <br />
              {t("لا يمكن التراجع عن هذا الإجراء")}.
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() => setClearCartDialog({ isOpen: false })}
              >
                {t("إلغاء")}
              </button>
              <button
                className="dialog-btn dialog-btn-danger"
                onClick={confirmClearCart}
              >
                {t("نعم، احذف الكل")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Dialog الخطأ  */}
      {errorDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">❌</div>
            <h3 className="dialog-title">{t("حدث خطأ")}</h3>
            <p className="dialog-message">{errorDialog.message}</p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={() =>
                  setErrorDialog({ isOpen: false, message: "" })
                }
                autoFocus
              >
                {t("حسناً")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}