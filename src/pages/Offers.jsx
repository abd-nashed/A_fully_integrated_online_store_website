import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts } from "../store/slices/productsSlice";
import { addToCart } from "../store/slices/cartSlice";
import { useTranslation } from "react-i18next";
import "../styles/Offers.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

export default function Offers() {
  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, isLoading, error } = useSelector((state) => state.products);

  //  الحالات
  const [search, setSearch] = useState("");

  //  جلب كل المنتجات
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  //  فلترة: خصم فقط
  const discountedProducts = products.filter(
    (p) => p.has_discount && p.discount_percent
  );

  //  البحث
  const filtered = discountedProducts.filter((p) => {
    const searchLower = search.toLowerCase();
    const name = (p.name || "").toLowerCase();
    const category = (p.category_name || "").toLowerCase();
    return name.includes(searchLower) || category.includes(searchLower);
  });

  //  Loading
  if (isLoading && products.length === 0) {
    return (
      <div className="offers-page">
        <div className="offers-loading">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="offers-page" style={{ direction: lang == 'ar' ? 'ltr' : 'rtl' }}>
      {/* Header */}
      <div className="offers-header">
        <div>
          <h1 className="offers-title">
            💸 {t('العروض')}
            <span className="offers-badge">
              {discountedProducts.length}
            </span>
          </h1>
          <p className="offers-subtitle">
            {t('خصومات حصرية على مجموعة مختارة من المنتجات')}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="offers-error">
          ⚠️ {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/* Search */}
      <div className="offers-search">
        <span className="offers-search-icon">🔍</span>
        <input
          type="text"
          className="offers-search-input"
          placeholder={t("ابحث عن عرض...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="offers-search-clear"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* Count */}
      <p className="offers-count">
        {filtered.length} {t('من')} {discountedProducts.length} {t('عرض')}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="offers-empty">
          <div className="offers-empty-icon">💸</div>
          <h3>{t('لا توجد عروض حالياً')}</h3>
          <p>
            {search
              ? t("لا توجد نتائج مطابقة للبحث")
              : t("تابعنا للحصول على أحدث العروض")}
          </p>
          {search && (
            <button
              className="offers-empty-btn"
              onClick={() => setSearch("")}
            >
              مسح البحث
            </button>
          )}
        </div>
      ) : (
        <div className="offers-grid">
          {filtered.map((product) => {
            const imageSrc = product.main_image?.startsWith("http")
              ? product.main_image
              : `${API_URL}${product.main_image}`;

            return (
              <div key={product.id} className="offer-card">
                {/* Link */}
                <Link
                  to={`/products/${product.id}`}
                  className="offer-card-link"
                >
                  {/* Image */}
                  <div className="offer-card-image">
                    <img src={imageSrc} alt={product.name} />

                    <span className="offer-discount-badge">
                      -{product.discount_percent}%
                    </span>

                    <span
                      className={`offer-status-badge ${product.is_active
                          ? "offer-status-active"
                          : "offer-status-inactive"
                        }`}
                    >
                      {product.is_active ? t("متاح") : t("غير متاح")}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="offer-card-info">
                    <h3 className="offer-card-name">{product.name}</h3>

                    <span className="offer-card-category">
                      {product.category_name}
                    </span>

                    {/* Price */}
                    <div className="offer-card-price">
                      <span className="offer-price-final">
                        ${product.final_price}
                      </span>
                      <span className="offer-price-old">
                        ${product.price}
                      </span>
                    </div>

                    {/* Save */}
                    <span className="offer-card-save">
                      💰 {t('توفير')} $
                      {(product.price - product.final_price).toFixed(2)}
                    </span>

                    {/* Stock */}
                    <span className="offer-card-stock">
                      📦 {product.stock} {t('في المخزون')}
                    </span>
                  </div>
                </Link>

                {/* Add to Cart */}
                <div className="offer-card-footer">
                  <button
                    className="offer-add-cart-btn"
                    disabled={!product.is_active || product.stock <= 0}
                    onClick={() => {
                      if (!product.is_active || product.stock <= 0) return;
                      dispatch(addToCart(product));
                    }}
                  >
                    🛒 {product.stock <= 0 ? t("نفد المخزون") : t("أضف للسلة")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}