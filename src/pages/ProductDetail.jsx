import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import axiosInstance from "../services/axiosInstance";
import { addToCart } from "../store/slices/cartSlice";
import "../styles/ProductDetail.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  //  الحالات
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState("");

  //  جلب المنتج
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/get_product/${productId}/`);
        setProduct(response.data);

        const main = response.data.main_image?.startsWith("http")
          ? response.data.main_image
          : `${API_URL}${response.data.main_image}`;
        setActiveImage(main);
      } catch (err) {
        setError(err.response?.data?.error || t("فشل جلب المنتج"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  //  كل الصور
  const getAllImages = () => {
    if (!product) return [];
    const images = [];

    if (product.main_image) {
      images.push(
        product.main_image.startsWith("http")
          ? product.main_image
          : `${API_URL}${product.main_image}`
      );
    }

    ["image_1", "image_2", "image_3", "image_4", "image_5"].forEach((key) => {
      if (product[key]) {
        images.push(
          product[key].startsWith("http")
            ? product[key]
            : `${API_URL}${product[key]}`
        );
      }
    });

    return images;
  };

  //  Loading
  if (isLoading) {
    return (
      <div className="pd-page">
        <div className="pd-loading">
          <div className="pd-loading-spinner"></div>
          <p>{t("جاري التحميل")}...</p>
        </div>
      </div>
    );
  }

  //  Error
  if (error || !product) {
    return (
      <div className="pd-page">
        <div className="pd-error">
          <div className="pd-error-icon">🔍</div>
          <h2>{t("المنتج غير موجود")}</h2>
          <p>{error}</p>
          <button
            className="pd-error-btn"
            onClick={() => navigate("/categories")}
          >
            {t("العودة للأقسام")}
          </button>
        </div>
      </div>
    );
  }

  const hasDiscount = product.has_discount && product.discount_percent;
  const allImages = getAllImages();
  const publishedDate = new Date(product.created_at).toLocaleDateString(
    "ar-EG",
    { year: "numeric", month: "long", day: "numeric" }
  );

  //  هل المنتج قابل للإضافة؟
  const isAvailable = product.is_active && product.stock > 0;

  return (
    <div
      className="pd-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* زر عودة */}
      <button className="pd-back-btn" onClick={() => navigate(-1)}>
        ← {t("عودة")}
      </button>

      {/* Container - عمودان */}
      <div className="pd-container">
        {/*  Left: Images  */}
        <div className="pd-images">
          <div className="pd-main-image">
            <img src={activeImage} alt={product.name} />

            {hasDiscount && (
              <span className="pd-discount-badge">
                -{product.discount_percent}%
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="pd-thumbnails">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  className={`pd-thumbnail ${
                    activeImage === img ? "active" : ""
                  }`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`صورة ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/*  Right: Info  */}
        <div className="pd-info">
          <h1 className="pd-name">{product.name}</h1>

          <div className="pd-description-block">
            <h3 className="pd-block-title">📝 {t("الوصف")}</h3>
            <p className="pd-description">
              {product.description || t("لا يوجد وصف لهذا المنتج")}
            </p>
          </div>

          <div className="pd-info-grid">
            {/* السعر */}
            <div className="pd-info-item pd-info-price">
              <span className="pd-info-icon">💰</span>
              <div>
                <span className="pd-info-label">{t("السعر")}</span>
                {hasDiscount ? (
                  <div className="pd-info-price-row">
                    <span className="pd-info-price-final">
                      ${product.final_price}
                    </span>
                    <span className="pd-info-price-old">${product.price}</span>
                  </div>
                ) : (
                  <span className="pd-info-price-final">
                    ${product.price}
                  </span>
                )}
              </div>
            </div>

            {/* الخصم */}
            {hasDiscount && (
              <div className="pd-info-item pd-info-discount">
                <span className="pd-info-icon">💸</span>
                <div>
                  <span className="pd-info-label">{t("الخصم")}</span>
                  <span className="pd-info-value pd-info-value-discount">
                    {product.discount_percent}%
                  </span>
                </div>
              </div>
            )}

            {/* المخزون */}
            <div className="pd-info-item">
              <span className="pd-info-icon">📦</span>
              <div>
                <span className="pd-info-label">{t("المخزون")}</span>
                <span className="pd-info-value">
                  {product.stock} {t("قطعة")}
                </span>
              </div>
            </div>

            {/* القسم */}
            <div className="pd-info-item">
              <span className="pd-info-icon">🏷️</span>
              <div>
                <span className="pd-info-label">{t("القسم")}</span>
                <span className="pd-info-value">{product.category_name}</span>
              </div>
            </div>

            {/* المتجر */}
            {product.store_name && (
              <div className="pd-info-item pd-info-store">
                <span className="pd-info-icon">🏪</span>
                <div>
                  <span className="pd-info-label">{t("المتجر")}</span>
                  <span className="pd-info-value">{product.store_name}</span>
                </div>
              </div>
            )}

            {/* التاريخ */}
            <div className="pd-info-item pd-info-date">
              <span className="pd-info-icon">📅</span>
              <div>
                <span className="pd-info-label">{t("تاريخ النشر")}</span>
                <span className="pd-info-value">{publishedDate}</span>
              </div>
            </div>
          </div>

          {/*  زر أضف للسلة */}
          <button
            className="pd-add-cart-btn"
            disabled={!isAvailable}
            onClick={() => {
              if (!isAvailable) return;
              dispatch(addToCart(product));
            }}
          >
            {isAvailable ? (
              <>🛒 {t("أضف للسلة")}</>
            ) : (
              <>❌ {t("غير متاح")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}