import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { verifySuperAdmin, clearError } from "../store/slices/usersSlice";
import "../styles/Login.css";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.users);
  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Dialogs
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  //  تسجيل الدخول
  const handleSubmit = async (e) => {
    e.preventDefault();

    // تحقق من المدخلات
    if (!username.trim() || !password.trim()) {
      setShowError(true);
      return;
    }

    dispatch(clearError());

    // إرسال الطلب
    const result = await dispatch(
      verifySuperAdmin({ username, password })
    );

    if (verifySuperAdmin.fulfilled.match(result)) {
      setShowSuccess(true);
    } else {
      setShowError(true);
    }
  };

  //  إغلاق Dialog النجاح → التوجيه حسب الدور
  const handleSuccessClose = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));

    setShowSuccess(false);
    setUsername("");
    setPassword("");

    // superadmin → /admin ، الباقي → /
    if (user?.role === "superadmin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  //  إغلاق Dialog الخطأ
  const handleErrorClose = () => {
    setShowError(false);
    dispatch(clearError());
  };

  //  إلغاء
  const handleCancel = () => {
    setUsername("");
    setPassword("");
    dispatch(clearError());
    navigate(-1);
  };

  return (
    <div className="login-page" style={{direction:lang == 'ar'?'ltr':'rtl'}}>
      <div className="login-card">
        <div className="login-icon">🔐</div>

        <h1 className="login-title">{t('تسجيل الدخول')}</h1>
        <p className="login-subtitle">
          {t('أدخل بياناتك للوصول إلى لوحة التحكم')}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label" htmlFor="username">
              {t('اسم المستخدم')}
            </label>
            <input
              id="username"
              type="text"
              className="login-input"
              placeholder={t('اسم المستخدم')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="login-form-group">
            <label className="login-label" htmlFor="password">
              {t('كلمة المرور')}
            </label>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder={t('كلمة المرور')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="login-actions">
            <button
              type="button"
              className="login-btn login-btn-cancel"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t('إلغاء')}
            </button>

            <button
              type="submit"
              className="login-btn login-btn-submit"
              disabled={isLoading}
            >
              {isLoading ? t('جاري التحقق') : t("تسجيل الدخول")}
            </button>
          </div>
        </form>
      </div>

      {/* Dialog نجاح */}
      {showSuccess && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-success">✅</div>
            <h3 className="dialog-title">{t('نجح تسجيل الدخول')}</h3>
            <p className="dialog-message">
              {t('مرحبًا بك')} <strong>{username}</strong>
              <br />
              {t('جاري توجيهك')}...
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={handleSuccessClose}
                autoFocus
              >
                {t('متابعة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog خطأ */}
      {showError && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">❌</div>
            <h3 className="dialog-title">{t('فشل تسجيل الدخول')}</h3>
            <p className="dialog-message">
              {error || t("بيانات الدخول غير صحيحة")}
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={handleErrorClose}
                autoFocus
              >
                {t('حسناً')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}