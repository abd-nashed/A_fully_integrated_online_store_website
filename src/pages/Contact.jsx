import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { sendMessage, clearContactError } from "../store/slices/contactSlice";
import "../styles/Contact.css";

export default function Contact() {
  const dispatch = useDispatch();
  const { isSending, error } = useSelector((state) => state.contact);

  const lang = useSelector((state) => state.lang.lang);
  const currentUser = useSelector((state) => state.users.currentUser);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  //  هل يمكنه رؤية الرسائل؟
  const canViewMessages = ["superadmin", "admin", "sales", "store"].includes(
    currentUser?.role
  );

  //  الحالات
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    message: "",
  });

  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: "",
  });

  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  التعديل على الحقول
  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  //  الإرسال
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال اسمك") });
      return;
    }
    if (!form.phone.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال رقم هاتفك") });
      return;
    }
    if (!form.message.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى كتابة رسالتك") });
      return;
    }

    dispatch(clearContactError());

    const result = await dispatch(sendMessage(form));

    if (sendMessage.fulfilled.match(result)) {
      setForm({ full_name: "", phone: "", message: "" });
      setSuccessDialog({
        isOpen: true,
        message: t("تم إرسال رسالتك بنجاح. سنتواصل معك قريبًا."),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message:
          typeof result.payload === "string"
            ? result.payload
            : t("فشل إرسال الرسالة. تحقق من البيانات."),
      });
    }
  };

  return (
    <div
      className="contact-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* Header */}
      <div className="contact-header">
        <h1 className="contact-title">{t("تواصل معنا")}</h1>
        <p className="contact-subtitle">
          {t("نحن هنا لمساعدتك. تواصل معنا في أي وقت.")}
        </p>

        {/*  زر عرض الرسائل — للمسؤولين فقط */}
        {canViewMessages && (
          <Link to="/admin/messages" className="contact-view-messages-btn">
            📬 {t("عرض الرسائل")}
            <span className="contact-view-messages-arrow">←</span>
          </Link>
        )}
      </div>

      <div className="contact-container">
        {/*  يسار: معلومات التواصل  */}
        <div className="contact-info">
          <h2 className="contact-info-title">{t("قنوات التواصل")}</h2>

          {/* واتساب */}
          <a
            href="https://wa.me/963912345678"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-channel contact-channel-whatsapp"
          >
            <div className="contact-channel-icon">📱</div>
            <div className="contact-channel-text">
              <span className="contact-channel-label">{t("واتساب")}</span>
              <span className="contact-channel-value">
                {t("تواصل سريع")}
              </span>
            </div>
            <span className="contact-channel-arrow">←</span>
          </a>

          {/* فيسبوك */}
          <a
            href="https://facebook.com/yourpage"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-channel contact-channel-facebook"
          >
            <div className="contact-channel-icon">📘</div>
            <div className="contact-channel-text">
              <span className="contact-channel-label">{t("فيسبوك")}</span>
              <span className="contact-channel-value">
                {t("تابعنا")}
              </span>
            </div>
            <span className="contact-channel-arrow">←</span>
          </a>

          {/* انستغرام */}
          <a
            href="https://instagram.com/yourpage"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-channel contact-channel-instagram"
          >
            <div className="contact-channel-icon">📷</div>
            <div className="contact-channel-text">
              <span className="contact-channel-label">{t("انستغرام")}</span>
              <span className="contact-channel-value">
                {t("شاهد أعمالنا")}
              </span>
            </div>
            <span className="contact-channel-arrow">←</span>
          </a>

          {/* معلومة إضافية */}
          <div className="contact-note">
            <span className="contact-note-icon">💬</span>
            <p>
              {t(
                "أو أرسل لنا رسالة مباشرة عبر الموقع وسنرد عليك في أقرب وقت."
              )}
            </p>
          </div>
        </div>

        {/*  يمين: فورم الإرسال  */}
        <div className="contact-form-wrapper">
          <h2 className="contact-form-title">{t("أرسل رسالة")}</h2>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-group">
              <label className="contact-form-label">{t("الاسم الكامل")}</label>
              <input
                type="text"
                className="contact-form-input"
                placeholder={t("أدخل اسمك")}
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                disabled={isSending}
                required
              />
            </div>

            <div className="contact-form-group">
              <label className="contact-form-label">{t("رقم الهاتف")}</label>
              <input
                type="tel"
                className="contact-form-input"
                placeholder="09XXXXXXXX"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={isSending}
                required
              />
            </div>

            <div className="contact-form-group">
              <label className="contact-form-label">{t("الرسالة")}</label>
              <textarea
                className="contact-form-textarea"
                placeholder={t("اكتب رسالتك هنا...")}
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                rows={5}
                disabled={isSending}
                required
              />
            </div>

            <button
              type="submit"
              className="contact-form-submit"
              disabled={isSending}
            >
              {isSending ? t("جاري الإرسال...") : t("إرسال الرسالة")}
            </button>
          </form>
        </div>
      </div>

      {/*  Dialog النجاح  */}
      {successDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-success">✅</div>
            <h3 className="dialog-title">{t("نجحت العملية")}</h3>
            <p className="dialog-message">{successDialog.message}</p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-primary"
                onClick={() =>
                  setSuccessDialog({ isOpen: false, message: "" })
                }
                autoFocus
              >
                {t("حسناً")}
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