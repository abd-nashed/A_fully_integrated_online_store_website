import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchMessages,
  deleteMessage,
  clearContactError,
} from "../store/slices/contactSlice";
import "../styles/Messages.css";

export default function Messages() {
  const dispatch = useDispatch();
  const { messages, isLoading, error } = useSelector((state) => state.contact);

  const lang = useSelector((state) => state.lang.lang);
  const currentUser = useSelector((state) => state.users.currentUser);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  //  الصلاحيات
  const canView = ["superadmin", "admin", "sales","store"].includes(
    currentUser?.role
  );

  //  الحالات
  const [search, setSearch] = useState("");

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: "",
  });

  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  جلب الرسائل
  useEffect(() => {
    dispatch(fetchMessages());
  }, [dispatch]);

  //  البحث
  const filtered = messages.filter((m) => {
    const s = search.toLowerCase();
    return (
      (m.full_name || "").toLowerCase().includes(s) ||
      (m.phone || "").toLowerCase().includes(s) ||
      (m.message || "").toLowerCase().includes(s)
    );
  });

  //  فتح Dialog الحذف
  const openDeleteDialog = (message) => {
    setDeleteDialog({
      isOpen: true,
      id: message.id,
      name: message.full_name,
    });
  };

  //  تأكيد الحذف
  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ isOpen: false, id: null, name: "" });

    const result = await dispatch(deleteMessage(id));

    if (deleteMessage.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تم حذف الرسالة بنجاح"),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message: t("فشل حذف الرسالة"),
      });
    }
  };

  //  حماية الصفحة
  if (!canView) {
    return (
      <div className="messages-page">
        <div className="messages-no-access">
          <div className="messages-no-access-icon">🚫</div>
          <h2>{t('غير مصرح لك بالوصول')}</h2>
          <p>{t('هذه الصفحة متاحة للمسؤولين فقط')}</p>
        </div>
      </div>
    );
  }

  //  Loading
  if (isLoading && messages.length === 0) {
    return (
      <div className="messages-page">
        <div className="messages-loading">{t('جاري التحميل')}...</div>
      </div>
    );
  }

  return (
    <div
      className="messages-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* Header */}
      <div className="messages-header">
        <div>
          <h1 className="messages-title">
            📬 {t('الرسائل')}
            <span className="messages-badge">{messages.length}</span>
          </h1>
          <p className="messages-count">
            {filtered.length} {t('من')} {messages.length} {t('رسالة')}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="messages-error">
          ⚠️ {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/* Search */}
      <div className="messages-search">
        <span className="messages-search-icon">🔍</span>
        <input
          type="text"
          className="messages-search-input"
          placeholder={t("ابحث بالاسم أو الرقم أو الرسالة...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="messages-search-clear"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="messages-empty">
          <div className="messages-empty-icon">📭</div>
          <h3>{t("لا توجد رسائل")}</h3>
          <p>
            {search
              ? t("لا توجد نتائج مطابقة للبحث")
              : t("لم يستقبل الموقع أي رسائل بعد")}
          </p>
        </div>
      ) : (
        <div className="messages-list">
          {filtered.map((message) => (
            <div key={message.id} className="message-card">
              {/* Info */}
              <div className="message-card-info">
                <div className="message-card-avatar">
                  {message.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="message-card-details">
                  <h3 className="message-card-name">{message.full_name}</h3>
                  <div className="message-card-meta">
                    <span className="message-card-phone">
                      📞 {message.phone}
                    </span>
                    <span className="message-card-date">
                      📅{" "}
                      {new Date(message.created_at).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="message-card-body">
                <p className="message-card-text">{message.message}</p>
              </div>

              {/* Actions */}
              <div className="message-card-actions">
                <button
                  className="message-action message-action-delete"
                  onClick={() => openDeleteDialog(message)}
                  title="حذف"
                >
                  🗑️ {t('حذف')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog تأكيد الحذف */}
      {deleteDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">{t('تأكيد الحذف')}</h3>
            <p className="dialog-message">
              {t('هل أنت متأكد من حذف رسالة')}{" "}
              <strong>"{deleteDialog.name}"</strong>؟
              <br />
              {t('لا يمكن التراجع عن هذا الإجراء.')}
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() =>
                  setDeleteDialog({ isOpen: false, id: null, name: "" })
                }
              >
                {t("إلغاء")}
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

      {/* Dialog النجاح */}
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
                autoFocus
              >
                {t('حسناً')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog الخطأ */}
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