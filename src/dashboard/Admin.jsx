import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  verifySuperAdmin,
  fetchUsers,
  addUser,
  deleteUser,
} from "../store/slices/usersSlice";
import "../styles/Admin.css";

export default function Admin() {
  const { t, i18n } = useTranslation();
  const lang = useSelector((state) => {
    return state.lang.lang
  })
  const dispatch = useDispatch();
  const { users, isLoading, error } = useSelector((state) => state.users);

  // حالة الدخول
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");

  // نموذج إضافة مستخدم
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "sales",
  });

  //  Dialogs 
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    userId: null,
    username: "",
  });

  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: "",
  });

  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  جلب المستخدمين بعد الدخول
  useEffect(() => {
    i18n.changeLanguage('ar')
  }, [])
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUsers());
    }
  }, [isAuthenticated, dispatch]);

  //  التحقق من الرمز
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert("يرجى إدخال الاسم وكلمة المرور");
      return;
    }

    const result = await dispatch(
      verifySuperAdmin({ username, password })
    );

    if (verifySuperAdmin.fulfilled.match(result)) {
      setOwnerName(result.payload.username);
      setIsAuthenticated(true);
    } else {
      alert(result.payload || "❌ لا يمكنك الدخول إلى لوحة التحكم");
    }
  };

  //  إضافة مستخدم
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.username || !newUser.password) {
      setErrorDialog({
        isOpen: true,
        message: t("يرجى تعبئة جميع الحقول"),
      });
      return;
    }

    const result = await dispatch(addUser(newUser));

    if (addUser.fulfilled.match(result)) {
      setNewUser({ username: "", password: "", role: "sales" });
      setSuccessDialog({
        isOpen: true,
        message: `${t('تمت إضافة المستخدم')} "${result.payload.username}" ${t('بنجاح')}`,
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message: `❌ ${t('فشل إضافة المستخدم. قد يكون الاسم مستخدماً مسبقاً')}.`,
      });
    }
  };

  //  فتح Dialog الحذف
  const openDeleteDialog = (user) => {
    setDeleteDialog({
      isOpen: true,
      userId: user.id,
      username: user.username,
    });
  };

  //  تأكيد الحذف
  const confirmDelete = async () => {
    const id = deleteDialog.userId;
    setDeleteDialog({ isOpen: false, userId: null, username: "" });

    const result = await dispatch(deleteUser(id));
    if (deleteUser.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تم حذف المستخدم بنجاح"),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message: `❌ ${t('فشل حذف المستخدم')}`,
      });
    }
  };

  //  صفحة إدخال الرمز
  if (!isAuthenticated) {
    return (
      <div className="auth-page" >
        <div className="auth-card">
          <div className="auth-icon">🔐</div>
          <h1 className="auth-title">{t('الدخول للوحة التحكم')}</h1>
          <p className="auth-subtitle">{t('أدخل بيانات حساب المدير العام')}</p>

          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="text"
              className="auth-input"
              placeholder={t('اسم المستخدم')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              className="auth-input"
              placeholder={t('كلمة المرور')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? `${t('جاري التحقق')}...` : t('دخول')}
            </button>
          </form>

          {error && <p className="auth-hint">⚠️ {error}</p>}
        </div>
      </div>
    );
  }

  //  لوحة التحكم
  return (
    <div className="dashboard" style={{ direction: lang == 'ar' ? 'ltr' : 'rtl' }}>
      {/* Top Bar */}
      <div className="dashboard-topbar">
        <div className="dashboard-user-info">
          <div className="dashboard-user-avatar">👤</div>
          <div>
            <p className="dashboard-user-label">{t('مرحبًا بك')}</p>
            <h2 className="dashboard-user-name">{ownerName}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Add User Form */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">➕ {t('إضافة مستخدم جديد')}</h3>
          </div>

          <form className="dashboard-form" onSubmit={handleAddUser}>
            <div className="dashboard-form-row">
              <div className="dashboard-form-group">
                <label className="dashboard-label">{t('اسم المستخدم')}</label>
                <input
                  type="text"
                  className="dashboard-input"
                  placeholder={t('اسم المستخدم')}
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                />
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-label">{t('كلمة المرور')}</label>
                <input
                  type="password"
                  className="dashboard-input"
                  placeholder={t("كلمة المرور")}
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>

              <div className="dashboard-form-group">
                <label className="dashboard-label">{t('الصلاحية')}</label>
                <select
                  className="dashboard-select"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="superadmin">{t('مدير عام')}</option>
                  <option value="admin">{t('مسؤول كامل')}</option>
                  <option value="store">{t('مسؤول المتاجر')}</option>
                  <option value="sales">{t('مسؤول المبيعات')}</option>
                </select>
              </div>
            </div>

            <button type="submit" className="dashboard-submit">
              {t('إضافة المستخدم')}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              👥 {t('المستخدمون')} ({users.length})
            </h3>
          </div>

          {isLoading && (
            <div style={{ padding: "20px", textAlign: "center" }}>
              {t('جاري التحميل')}...
            </div>
          )}

          <div className="dashboard-users">
            {users.map((user) => (
              <div key={user.id} className="dashboard-user-row">
                <div className="dashboard-user-row-info">
                  <div className="dashboard-user-row-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="dashboard-user-row-name">
                      {user.username}
                    </p>
                    <p className="dashboard-user-row-id">#{user.id}</p>
                  </div>
                </div>

                <span
                  className={`dashboard-role dashboard-role-${user.role}`}
                >
                  {user.role === "superadmin" && t("مدير عام")}
                  {user.role === "admin" && t("مسؤول كامل")}
                  {user.role === "store" && t("مسؤول المتاجر")}
                  {user.role === "sales" && t("مسؤول المبيعات")}
                </span>

                <button
                  className="dashboard-delete-btn"
                  onClick={() => openDeleteDialog(user)}
                >
                  🗑️
                </button>
              </div>
            ))}

            {!isLoading && users.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center" }}>
                لا يوجد مستخدمون
              </div>
            )}
          </div>
        </div>
      </div>

      {/*  Delete Dialog  */}
      {deleteDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">{t('تأكيد الحذف')}</h3>
            <p className="dialog-message">
              {t('هل أنت متأكد من حذف المستخدم')}{" "}
              <strong>"{deleteDialog.username}"</strong>؟
              <br />
              {t('لا يمكن التراجع عن هذا الإجراء')}.
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() =>
                  setDeleteDialog({
                    isOpen: false,
                    userId: null,
                    username: "",
                  })
                }
              >
                {t('إلغاء')}
              </button>
              <button
                className="dialog-btn dialog-btn-danger"
                onClick={confirmDelete}
              >
                {t('حذف')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Success Dialog  */}
      {successDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-success">✅</div>
            <h3 className="dialog-title">{t('نجحت العملية')}</h3>
            <p className="dialog-message">{successDialog.message}</p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={() =>
                  setSuccessDialog({ isOpen: false, message: "" })
                }
              >
                {t('حسناً')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Error Dialog  */}
      {errorDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">❌</div>
            <h3 className="dialog-title">{t('حدث خطأ')}</h3>
            <p className="dialog-message">{errorDialog.message}</p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={() =>
                  setErrorDialog({ isOpen: false, message: "" })
                }
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