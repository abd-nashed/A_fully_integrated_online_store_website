import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import "../styles/TrackOrder.css";

export default function TrackOrder() {
  const dispatch = useDispatch();

  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  //  الحالات
  const [code, setCode] = useState("");
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  //  البحث عن الطلب
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError(t("يرجى إدخال كود التتبع"));
      setOrder(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await axiosInstance.get(
        `/track_order/${code.trim().toUpperCase()}/`
      );
      setOrder(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || t("كود التتبع غير صحيح")
      );
    } finally {
      setIsLoading(false);
    }
  };

  //  مراحل الطلب
  const getStatusIndex = (status) => {
    const steps = ["pending", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  return (
    <div
      className="to-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* Header */}
      <div className="to-header">
        <div className="to-header-icon">📦</div>
        <h1 className="to-title">{t("تتبع طلبك")}</h1>
        <p className="to-subtitle">
          {t("أدخل كود التتبع الذي حصلت عليه عند الشراء")}
        </p>
      </div>

      {/* Search Form */}
      <form className="to-form" onSubmit={handleSearch}>
        <div className="to-input-wrapper">
          <input
            type="text"
            className="to-input"
            placeholder={t("مثال: A3F9B2C1")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={12}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            className="to-search-btn"
            disabled={isLoading}
          >
            {isLoading ? t("جاري البحث...") : `🔍 ${t("تتبع")}`}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="to-error">
          <span className="to-error-icon">❌</span>
          {error}
        </div>
      )}

      {/* Order Result */}
      {order && (
        <div className="to-result">
          {/* Order Info */}
          <div className="to-card">
            <div className="to-card-header">
              <h2 className="to-card-title">
                📋 {t("تفاصيل الطلب")} #{order.id}
              </h2>
              <span className="to-card-code">🔍 {order.tracking_code}</span>
            </div>

            {/* Status Badge */}
            <div className="to-status-wrapper">
              <span className={`to-status to-status-${order.status}`}>
                {order.status_display}
              </span>
            </div>

            {/* Tracking Steps */}
            <div className="to-steps">
              {/* Step 1: Pending */}
              <div
                className={`to-step ${
                  getStatusIndex(order.status) >= 0 ? "active" : ""
                } ${
                  getStatusIndex(order.status) > 0 ? "completed" : ""
                }`}
              >
                <div className="to-step-icon">
                  {getStatusIndex(order.status) > 0 ? "✅" : "📝"}
                </div>
                <div className="to-step-content">
                  <h3 className="to-step-title">
                    {t("لم يتم الإرسال بعد")}
                  </h3>
                  <p className="to-step-desc">
                    {t("تم استلام طلبك وجاري معالجته")}
                  </p>
                </div>
              </div>

              {/* خط */}
              <div
                className={`to-step-line ${
                  getStatusIndex(order.status) >= 1 ? "active" : ""
                }`}
              ></div>

              {/* Step 2: Shipped */}
              <div
                className={`to-step ${
                  getStatusIndex(order.status) >= 1 ? "active" : ""
                } ${
                  getStatusIndex(order.status) > 1 ? "completed" : ""
                }`}
              >
                <div className="to-step-icon">
                  {getStatusIndex(order.status) > 1
                    ? "✅"
                    : getStatusIndex(order.status) === 1
                    ? "🚚"
                    : "🚚"}
                </div>
                <div className="to-step-content">
                  <h3 className="to-step-title">{t("في طريقه إليك")}</h3>
                  <p className="to-step-desc">
                    {t("طلبك في الطريق إلى عنوانك")}
                  </p>
                </div>
              </div>

              {/* خط */}
              <div
                className={`to-step-line ${
                  getStatusIndex(order.status) >= 2 ? "active" : ""
                }`}
              ></div>

              {/* Step 3: Delivered */}
              <div
                className={`to-step ${
                  getStatusIndex(order.status) >= 2 ? "active" : ""
                }`}
              >
                <div className="to-step-icon">
                  {getStatusIndex(order.status) >= 2 ? "🎉" : "📦"}
                </div>
                <div className="to-step-content">
                  <h3 className="to-step-title">{t("تم البيع")}</h3>
                  <p className="to-step-desc">
                    {t("تم تسليم الطلب بنجاح")}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="to-details">
              <div className="to-detail-row">
                <span className="to-detail-label">
                  👤 {t("اسم الزبون")}
                </span>
                <span className="to-detail-value">{order.full_name}</span>
              </div>

              <div className="to-detail-row">
                <span className="to-detail-label">📞 {t("الهاتف")}</span>
                <span className="to-detail-value">{order.phone}</span>
              </div>

              <div className="to-detail-row">
                <span className="to-detail-label">📍 {t("العنوان")}</span>
                <span className="to-detail-value">{order.address}</span>
              </div>

              <div className="to-detail-row">
                <span className="to-detail-label">
                  📅 {t("تاريخ الطلب")}
                </span>
                <span className="to-detail-value">
                  {new Date(order.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="to-detail-row to-detail-total">
                <span className="to-detail-label">
                  💰 {t("الإجمالي")}
                </span>
                <span className="to-detail-value">${order.total}</span>
              </div>
            </div>

            {/* Products */}
            {order.items && order.items.length > 0 && (
              <div className="to-products">
                <h3 className="to-products-title">
                  📦 {t("منتجات الطلب")}
                </h3>

                {order.items.map((item) => (
                  <div key={item.id} className="to-product-item">
                    <div className="to-product-info">
                      <h4 className="to-product-name">
                        {item.product_name}
                      </h4>
                      {item.store_name && (
                        <span className="to-product-store">
                          🏪 {item.store_name}
                        </span>
                      )}
                    </div>

                    <div className="to-product-details">
                      <span className="to-product-qty">
                        × {item.quantity}
                      </span>
                      <span className="to-product-price">
                        ${item.subtotal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="to-actions">
            <button
              className="to-btn to-btn-again"
              onClick={() => {
                setOrder(null);
                setCode("");
                setError("");
              }}
            >
              🔍 {t("تتبع طلب آخر")}
            </button>

            <Link to="/" className="to-btn to-btn-home">
              🏠 {t("العودة للرئيسية")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}