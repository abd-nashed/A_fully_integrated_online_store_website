import { useState, useEffect } from "react";
import "../../styles/HeaderHome.css";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { edit } from "../../store/slices/langugeSlice";
import { logout } from "../../store/slices/usersSlice";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = useSelector((state) => state.lang.lang);
  const currentUser = useSelector((state) => state.users.currentUser);
  const cartCount = useSelector((state) => state.cart?.items?.length || 0);

  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  function handelLang() {
    dispatch(edit());
  }

  const openLogoutDialog = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutDialog(false);
    setIsMenuOpen(false);
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header
        className="header"
        style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
      >
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="header-logo" onClick={closeMobileMenu}>
            <span className="header-logo-icon">
              <span className="header-logo-icon-glow">🛍️</span>
            </span>
            <span className="header-logo-text">
              {t("متجري")}
              <span className="header-logo-dot">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav">
            <NavLink to="/" end className="header-nav-link">
              {t("الرئيسية")}
            </NavLink>
            <NavLink to="/categories" end className="header-nav-link">
              {t("الأقسام")}
            </NavLink>
            <NavLink to="/offers" end className="header-nav-link">
              {t("العروض")}
              <span className="header-nav-badge">-30%</span>
            </NavLink>
            <NavLink to="/stores" end className="header-nav-link">
              {t("المتاجر")}
            </NavLink>
            <NavLink to="/track" end className="header-nav-link">
              {t("تتبع طلبك")}
            </NavLink>
            <NavLink to="/contact" end className="header-nav-link">
              {t("تواصل معنا")}
            </NavLink>
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions">
            {/* Cart */}
            <Link to="/cart" className="header-cart-btn" title={t("السلة")}>
              <span className="header-cart-icon">🛒</span>
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartCount}</span>
              )}
            </Link>

            {/* Theme */}
            <button
              className="header-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "light" ? t("الوضع الليلي") : t("الوضع النهاري")}
            >
              <span className="header-theme-icon">
                {theme === "light" ? "🌙" : "☀️"}
              </span>
            </button>

            {/* Language */}
            <button
              className="header-lang-btn"
              aria-label="تغيير اللغة"
              onClick={handelLang}
            >
              <span className="header-lang-icon">🌐</span>
              <span className="header-lang-text">
                {lang === "ar" ? "عربي" : "EN"}
              </span>
            </button>

            {/* User OR Login */}
            {currentUser ? (
              <div className="header-user-box">
                <div className="header-user-info">
                  <div className="header-user-avatar">
                    {currentUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="header-user-text">
                    <span className="header-user-name">
                      {currentUser.username}
                    </span>
                    <span className="header-user-role">
                      {currentUser.role === "superadmin" && t("مدير عام")}
                      {currentUser.role === "admin" && t("مسؤول كامل")}
                      {currentUser.role === "store" && t("مسؤول المتاجر")}
                      {currentUser.role === "sales" && t("مسؤول المبيعات")}
                    </span>
                  </div>
                </div>
                <button
                  className="header-user-logout"
                  onClick={openLogoutDialog}
                  title={t("تسجيل الخروج")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <Link to="/login" className="header-login-link">
                <button className="header-login-btn">
                  <span>{t("التسجيل كمسؤول")}</span>
                  <span className="header-login-arrow">→</span>
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`header-menu-btn ${isMenuOpen ? "open" : ""}`}
            aria-label="القائمة"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`header-mobile-menu ${isMenuOpen ? "open" : ""}`}>
          <nav className="header-mobile-nav">
            <NavLink to="/" end className="header-mobile-link" onClick={closeMobileMenu}>
              <span className="header-mobile-link-num">01</span>
              {t("الرئيسية")}
            </NavLink>
            <NavLink
              to="/categories"
              end
              className="header-mobile-link"
              onClick={closeMobileMenu}
            >
              <span className="header-mobile-link-num">02</span>
              {t("الأقسام")}
            </NavLink>
            <NavLink
              to="/offers"
              end
              className="header-mobile-link"
              onClick={closeMobileMenu}
            >
              <span className="header-mobile-link-num">03</span>
              {t("العروض")}
            </NavLink>
            <NavLink
              to="/stores"
              end
              className="header-mobile-link"
              onClick={closeMobileMenu}
            >
              <span className="header-mobile-link-num">04</span>
              {t("المتاجر")}
            </NavLink>
            <NavLink
              to="/track"
              end
              className="header-mobile-link"
              onClick={closeMobileMenu}
            >
              <span className="header-mobile-link-num">05</span>
              {t("تتبع طلبك")}
            </NavLink>
            <NavLink
              to="/contact"
              end
              className="header-mobile-link"
              onClick={closeMobileMenu}
            >
              <span className="header-mobile-link-num">06</span>
              {t("تواصل معنا")}
            </NavLink>
          </nav>

          <div className="header-mobile-actions">
            <button className="header-mobile-theme-btn" onClick={toggleTheme}>
              <span>{theme === "light" ? "🌙" : "☀️"}</span>
              <span>
                {theme === "light" ? t("الوضع الليلي") : t("الوضع النهاري")}
              </span>
            </button>

            <button className="header-mobile-lang-btn" onClick={handelLang}>
              <span>🌐</span>
              <span>{lang === "ar" ? "عربي" : "English"}</span>
            </button>

            <Link
              to="/cart"
              className="header-mobile-cart-btn"
              onClick={closeMobileMenu}
            >
              <span>🛒</span>
              <span>{t("السلة")}</span>
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartCount}</span>
              )}
            </Link>

            {currentUser ? (
              <>
                <div className="header-mobile-user-box">
                  <div className="header-mobile-user-info">
                    <div className="header-user-avatar">
                      {currentUser.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="header-user-text">
                      <span className="header-user-name">
                        {currentUser.username}
                      </span>
                      <span className="header-user-role">
                        {currentUser.role === "superadmin" && t("مدير عام")}
                        {currentUser.role === "admin" && t("مسؤول كامل")}
                        {currentUser.role === "store" && t("مسؤول المتاجر")}
                        {currentUser.role === "sales" && t("مسؤول المبيعات")}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="header-mobile-logout-btn"
                  onClick={openLogoutDialog}
                >
                  🚪 {t("تسجيل الخروج")}
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMobileMenu}>
                <button className="header-mobile-login-btn">
                  {t("التسجيل كمسؤول")}
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="logout-dialog-overlay" onClick={cancelLogout}>
          <div className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="logout-dialog-icon">🚪</div>
            <h3 className="logout-dialog-title">{t("تأكيد الخروج")}</h3>
            <p className="logout-dialog-message">
              {t("هل أنت متأكد من تسجيل الخروج من الحساب")}؟
            </p>
            <div className="logout-dialog-actions">
              <button
                className="logout-dialog-btn logout-dialog-cancel"
                onClick={cancelLogout}
              >
                {t("إلغاء")}
              </button>
              <button
                className="logout-dialog-btn logout-dialog-confirm"
                onClick={confirmLogout}
              >
                {t("تسجيل الخروج")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}