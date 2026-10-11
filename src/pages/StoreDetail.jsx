import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import axiosInstance from "../services/axiosInstance";
import { addToCart } from "../store/slices/cartSlice";
import "../styles/StoreDetail.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

export default function StoreDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const lang = useSelector((state) => state.lang.lang);
  const currentUser = useSelector((state) => state.users.currentUser);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  //  الصلاحيات — عرض الرقم
  const canViewPhone = ["superadmin", "admin", "store"].includes(
    currentUser?.role
  );

  //  الحالات
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  //  جلب المتجر + منتجاته
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const storeRes = await axiosInstance.get(`/get_store/${storeId}/`);
        setStore(storeRes.data);

        const productsRes = await axiosInstance.get(
          `/get_products_by_store/${storeId}/`
        );
        setProducts(productsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || t("فشل جلب البيانات"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  //  البحث
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (p.name || "").toLowerCase().includes(q);
  });

  //  Loading
  if (isLoading) {
    return (
      <div className="sd-page">
        <div className="sd-loading">
          <div className="sd-loading-spinner"></div>
          <p>{t("جاري التحميل")}...</p>
        </div>
      </div>
    );
  }

  //  Error
  if (error || !store) {
    return (
      <div className="sd-page">
        <div className="sd-error">
          <div className="sd-error-icon">🏪</div>
          <h2>{t("المتجر غير موجود")}</h2>
          <p>{error}</p>
          <button
            className="sd-error-btn"
            onClick={() => navigate("/stores")}
          >
            {t("العودة للمتاجر")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sd-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* زر عودة */}
      <button className="sd-back-btn" onClick={() => navigate(-1)}>
        ← {t("عودة")}
      </button>

      {/*  بطاقة المتجر  */}
      <div className="sd-store-card">
        {/* الغلاف */}
        <div className="sd-store-cover">
          {store.image ? (
            <img
              src={
                store.image?.startsWith("http")
                  ? store.image
                  : `${API_URL}${store.image}`
              }
              alt={store.name}
            />
          ) : (
            <div className="sd-store-cover-placeholder">🏪</div>
          )}
        </div>

        {/* معلومات المتجر */}
        <div className="sd-store-info">
          <div className="sd-store-header">
            <div className="sd-store-avatar">
              {store.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sd-store-title-block">
              <h1 className="sd-store-name">{store.name}</h1>
            </div>
          </div>

          {store.description && (
            <p className="sd-store-description">{store.description}</p>
          )}

          {/*  معلومات الاتصال */}
          <div className="sd-store-contact">
            {/* المنطقة — للجميع */}
            {store.region && (
              <div className="sd-store-contact-item">
                <span className="sd-store-contact-icon">📍</span>
                <div>
                  <span className="sd-store-contact-label">
                    {t("المنطقة")}
                  </span>
                  <span className="sd-store-contact-value">
                    {store.region}
                  </span>
                </div>
              </div>
            )}

            {/* الرقم — فقط للمسؤولين */}
            {canViewPhone && store.phone && (
              <div className="sd-store-contact-item sd-store-contact-phone">
                <span className="sd-store-contact-icon">📞</span>
                <div>
                  <span className="sd-store-contact-label">
                    {t("رقم الهاتف")}
                  </span>
                  <a
                    href={`tel:${store.phone}`}
                    className="sd-store-contact-value sd-store-contact-link"
                  >
                    {store.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* إحصائيات */}
          <div className="sd-store-stats">
            <div className="sd-store-stat">
              <span className="sd-store-stat-icon">📦</span>
              <div>
                <span className="sd-store-stat-label">{t("المنتجات")}</span>
                <span className="sd-store-stat-value">{products.length}</span>
              </div>
            </div>

            <div className="sd-store-stat">
              <span className="sd-store-stat-icon">📅</span>
              <div>
                <span className="sd-store-stat-label">
                  {t("تاريخ الإضافة")}
                </span>
                <span className="sd-store-stat-value">
                  {new Date(store.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/*  زر التواصل */}
          <Link to="/contact" className="sd-contact-btn">
            📩 {t("تواصل معنا لعرض منتجاتك")}
          </Link>
        </div>
      </div>

      {/*  قسم المنتجات  */}
      <div className="sd-products-section">
        <div className="sd-products-header">
          <h2 className="sd-products-title">
            📦 {t("منتجات المتجر")}
            <span className="sd-products-badge">{products.length}</span>
          </h2>
        </div>

        {/* Search */}
        <div className="sd-search">
          <span className="sd-search-icon">🔍</span>
          <input
            type="text"
            className="sd-search-input"
            placeholder={t("ابحث في منتجات هذا المتجر...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="sd-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="sd-products-empty">
            <div className="sd-products-empty-icon">📭</div>
            <h3>
              {search
                ? t("لا توجد نتائج مطابقة")
                : t("لا توجد منتجات في هذا المتجر")}
            </h3>
            {search && (
              <button
                className="sd-products-empty-btn"
                onClick={() => setSearch("")}
              >
                {t("مسح البحث")}
              </button>
            )}
          </div>
        ) : (
          <div className="sd-products-grid">
            {filtered.map((product) => {
              const hasDiscount =
                product.has_discount && product.discount_percent;
              const imageSrc = product.main_image?.startsWith("http")
                ? product.main_image
                : `${API_URL}${product.main_image}`;

              return (
                <div key={product.id} className="sd-product-card">
                  {/* Link — الصورة + المعلومات */}
                  <Link
                    to={`/products/${product.id}`}
                    className="sd-product-card-link"
                  >
                    <div className="sd-product-image">
                      <img src={imageSrc} alt={product.name} />

                      {hasDiscount && (
                        <span className="sd-product-discount">
                          -{product.discount_percent}%
                        </span>
                      )}
                    </div>

                    <div className="sd-product-info">
                      <h3 className="sd-product-name">{product.name}</h3>

                      <span className="sd-product-category">
                        {product.category_name}
                      </span>

                      <div className="sd-product-price">
                        {hasDiscount ? (
                          <>
                            <span className="sd-product-price-final">
                              ${product.final_price}
                            </span>
                            <span className="sd-product-price-old">
                              ${product.price}
                            </span>
                          </>
                        ) : (
                          <span className="sd-product-price-final">
                            ${product.price}
                          </span>
                        )}
                      </div>

                      <span className="sd-product-stock">
                        📦 {product.stock} {t("في المخزون")}
                      </span>
                    </div>
                  </Link>

                  {/*  زر أضف للسلة — خارج الـ Link */}
                  <div className="sd-product-footer">
                    <button
                      className="sd-product-add-cart-btn"
                      disabled={
                        !product.is_active || product.stock <= 0
                      }
                      onClick={() => {
                        if (!product.is_active || product.stock <= 0) return;
                        dispatch(addToCart(product));
                      }}
                    >
                      🛒 {t("أضف للسلة")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}