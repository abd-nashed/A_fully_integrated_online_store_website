import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { fetchCategories } from "../store/slices/categorySlice";
import "../styles/Home.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

const HERO_IMAGES = {
  dark: "/images/img.PNG",
  light: "/images/light.JPG",
};

const STORAGE_KEY = "hero-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (e) {
    /* ignore */
  }

  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
  }

  return "dark";
}

function useThemeWithImage() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const timer = setTimeout(() => {
      const otherTheme = theme === "dark" ? "light" : "dark";
      const img = new Image();
      img.src = HERO_IMAGES[otherTheme];
    }, 2000);

    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;

    const observer = new MutationObserver(() => {
      const current = root.getAttribute("data-theme") || "dark";
      setTheme(current);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

if (typeof window !== "undefined") {
  const initial = getInitialTheme();
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = HERO_IMAGES[initial];

  if (!document.querySelector(`link[href="${HERO_IMAGES[initial]}"]`)) {
    document.head.appendChild(link);
  }
}

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = useSelector((state) => state.lang.lang);
  const { categories, isLoading } = useSelector((state) => state.category);

  const { t, i18n } = useTranslation();

  const theme = useThemeWithImage();

  const heroImage = useMemo(() => HERO_IMAGES[theme], [theme]);

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const latestCategories = categories.slice(0, 6);

  return (
    <main
      className="home"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      <section className="hero">
        <div className="hero-bg-accent"></div>
        <div className="hero-bg-grid"></div>

        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">
              <span className="hero-badge-dot"></span>
              {t("عروض حصرية هذا الأسبوع")}
            </span>

            <h1 className="hero-title">
              <span className="hero-title-line">
                {t("تسوّق بذكاء")}
              </span>
              <span className="hero-title-line hero-title-line-2">
                {t("واستلم في")}{" "}
                <span className="hero-highlight">{t("أسرع وقت")}</span>
              </span>
            </h1>

            <p className="hero-description">
              {t("آلاف المنتجات من أفضل المتاجر، بأسعار تنافسية وتوصيل سريع")}
            </p>

            <div className="hero-actions">
              <button
                className="hero-btn-primary"
                onClick={() => navigate("/stores")}
              >
                <span>{t("ابدأ التسوق الآن")}</span>
                <span className="hero-btn-arrow">→</span>
              </button>
              <button
                className="hero-btn-secondary"
                onClick={() => navigate("/categories")}
              >
                {t("تصفّح الأقسام")}
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">10K+</span>
                <span className="hero-stat-label">{t("منتج")}</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">500+</span>
                <span className="hero-stat-label">{t("متجر")}</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">50K+</span>
                <span className="hero-stat-label">{t("زبون سعيد")}</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-glow"></div>
            <div className="hero-ring hero-ring-1"></div>
            <div className="hero-ring hero-ring-2"></div>
            <div className="hero-ring hero-ring-3"></div>

            <img
              src={heroImage}
              alt={t("صورة تسويقية")}
              className="hero-image"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </div>

        <div className="hero-bottom-line"></div>
      </section>

      <section className="categories">
        <div className="categories-container">
          <div className="categories-header">
            <div className="categories-header-left">
              <span className="categories-eyebrow">
                {t("تصفّح الأقسام")}
              </span>
              <h2 className="categories-title">
                {t("اختر من بين مجموعة واسعة من الفئات")}
              </h2>
            </div>
            <Link to="/categories" className="categories-view-all">
              <span>{t("عرض الكل")}</span>
              <span className="categories-view-all-arrow">→</span>
            </Link>
          </div>

          {isLoading && categories.length === 0 ? (
            <div className="home-loading">
              <div className="home-loading-spinner"></div>
              <span>{t("جاري التحميل")}...</span>
            </div>
          ) : latestCategories.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon">📭</div>
              <p>{t("لا توجد أقسام حالياً")}</p>
            </div>
          ) : (
            <div className="categories-grid">
              {latestCategories.map((category, index) => (
                <Link
                  to={`/categories/${category.id}/products`}
                  key={category.id}
                  className="category-card"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="category-image">
                    <img
                      src={
                        category.image?.startsWith("http")
                          ? category.image
                          : `${API_URL}${category.image}`
                      }
                      alt={category.name}
                      loading="lazy"
                    />
                    <div className="category-overlay"></div>
                  </div>
                  <div className="category-info">
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-count">
                      <span className="category-count-num">
                        {category.products_count || 0}
                      </span>
                      {t("منتج")}
                    </p>
                  </div>
                  <div className="category-hover-line"></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-cta">
        <div className="home-cta-container">
          <div className="home-cta-content">
            <span className="home-cta-eyebrow">
              {t("لا تفوت الفرصة")}
            </span>
            <h2 className="home-cta-title">
              {t("عروض حصرية")}{" "}
              <span className="home-cta-highlight">{t("بخصم 30%")}</span>
            </h2>
            <p className="home-cta-description">
              {t("سارع بالشراء قبل انتهاء العرض")}
            </p>
            <button
              className="home-cta-btn"
              onClick={() => navigate("/offers")}
            >
              <span>{t("تسوّق الآن")}</span>
              <span className="home-cta-btn-arrow">→</span>
            </button>
          </div>
          <div className="home-cta-visual">
            <div className="home-cta-glow"></div>
            <span className="home-cta-emoji">🎁</span>
          </div>
        </div>
      </section>
    </main>
  );
}