import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  fetchStores,
  fetchStoreRequests,
  addStore,
  updateStore,
  deleteStore,
  sendStoreRequest,
  approveStoreRequest,
  rejectStoreRequest,
  clearStoresError,
} from "../store/slices/storesSlice";
import "../styles/Stores.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

export default function Stores() {
  const dispatch = useDispatch();
  const { stores, requests, isLoading, isSending, error } = useSelector(
    (state) => state.stores
  );
  const currentUser = useSelector((state) => state.users.currentUser);

  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  //  الصلاحيات
  const canManage = ["superadmin", "admin", "store"].includes(
    currentUser?.role
  );

  //  الحالات
  const [activeTab, setActiveTab] = useState("stores");
  const [search, setSearch] = useState("");

  //  حالة حفظ الإضافة/التعديل (لمنع الضغط المتكرر)
  const [isSaving, setIsSaving] = useState(false);

  const [formDialog, setFormDialog] = useState({
    isOpen: false,
    mode: "add",
    id: null,
    name: "",
    phone: "",
    description: "",
    region: "",
    image: null,
    imagePreview: "",
  });

  const [requestDialog, setRequestDialog] = useState({
    isOpen: false,
    store_name: "",
    phone: "",
    description: "",
    region: "",
    image: null,
    imagePreview: "",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
    type: "store",
  });

  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: "",
  });

  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  الجلب
  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  //  جلب الطلبات فوراً للمسؤولين (بدون انتظار الضغط على التاب)
  useEffect(() => {
    if (canManage) {
      dispatch(fetchStoreRequests());
    }
  }, [dispatch, canManage]);

  //  البحث
  const filteredStores = stores.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.region || "").toLowerCase().includes(q)
    );
  });

  //  فتح Dialog الإضافة
  const openAddDialog = () => {
    dispatch(clearStoresError());
    setFormDialog({
      isOpen: true,
      mode: "add",
      id: null,
      name: "",
      phone: "",
      description: "",
      region: "",
      image: null,
      imagePreview: "",
    });
  };

  //  فتح Dialog التعديل
  const openEditDialog = (store) => {
    dispatch(clearStoresError());
    setFormDialog({
      isOpen: true,
      mode: "edit",
      id: store.id,
      name: store.name,
      phone: store.phone || "",
      description: store.description || "",
      region: store.region || "",
      image: null,
      imagePreview: store.image?.startsWith("http")
        ? store.image
        : `${API_URL}${store.image}`,
    });
  };

  //  إغلاق Dialog
  const closeFormDialog = () => {
    setFormDialog({
      isOpen: false,
      mode: "add",
      id: null,
      name: "",
      phone: "",
      description: "",
      region: "",
      image: null,
      imagePreview: "",
    });
  };

  //  اختيار صورة
  const handleFormImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormDialog({
        ...formDialog,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  //  حفظ
  const handleSave = async (e) => {
    e.preventDefault();

    //  منع الضغط المتكرر
    if (isSaving) return;

    if (!formDialog.name.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال اسم المتجر") });
      return;
    }
    if (!formDialog.phone.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال رقم الهاتف") });
      return;
    }
    if (!formDialog.description.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال الوصف") });
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", formDialog.name);
    formData.append("phone", formDialog.phone);
    formData.append("description", formDialog.description);
    formData.append("region", formDialog.region || "");
    if (formDialog.image) {
      formData.append("image", formDialog.image);
    }

    let result;
    if (formDialog.mode === "add") {
      result = await dispatch(addStore(formData));
    } else {
      result = await dispatch(updateStore({ id: formDialog.id, formData }));
    }

    setIsSaving(false);

    if (
      addStore.fulfilled.match(result) ||
      updateStore.fulfilled.match(result)
    ) {
      closeFormDialog();
      setSuccessDialog({
        isOpen: true,
        message:
          formDialog.mode === "add"
            ? t("تمت إضافة المتجر بنجاح")
            : t("تم تعديل المتجر بنجاح"),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message:
          typeof result.payload === "string"
            ? result.payload
            : t("فشلت العملية. تحقق من البيانات."),
      });
    }
  };

  //  Dialog الحذف
  const openDeleteDialog = (item, type = "store") => {
    setDeleteDialog({
      isOpen: true,
      id: item.id,
      name: type === "store" ? item.name : item.store_name,
      type,
    });
  };

  const confirmDelete = async () => {
    const { id, type } = deleteDialog;
    setDeleteDialog({ isOpen: false, id: null, name: "", type: "store" });

    let result;
    if (type === "store") {
      result = await dispatch(deleteStore(id));
      if (deleteStore.fulfilled.match(result)) {
        setSuccessDialog({
          isOpen: true,
          message: t("تم حذف المتجر بنجاح"),
        });
      } else {
        setErrorDialog({ isOpen: true, message: t("فشل حذف المتجر") });
      }
    } else {
      result = await dispatch(rejectStoreRequest(id));
      if (rejectStoreRequest.fulfilled.match(result)) {
        setSuccessDialog({
          isOpen: true,
          message: t("تم رفض الطلب"),
        });
      } else {
        setErrorDialog({ isOpen: true, message: t("فشل رفض الطلب") });
      }
    }
  };

  //  Dialog طلب متجر
  const openRequestDialog = () => {
    dispatch(clearStoresError());
    setRequestDialog({
      isOpen: true,
      store_name: "",
      phone: "",
      description: "",
      region: "",
      image: null,
      imagePreview: "",
    });
  };

  const closeRequestDialog = () => {
    setRequestDialog({
      isOpen: false,
      store_name: "",
      phone: "",
      description: "",
      region: "",
      image: null,
      imagePreview: "",
    });
  };

  const handleRequestImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRequestDialog({
        ...requestDialog,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();

    if (isSending) return;

    if (!requestDialog.store_name.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال اسم المتجر") });
      return;
    }
    if (!requestDialog.phone.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال رقم الهاتف") });
      return;
    }
    if (!requestDialog.description.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال الوصف") });
      return;
    }

    const formData = new FormData();
    formData.append("store_name", requestDialog.store_name);
    formData.append("phone", requestDialog.phone);
    formData.append("description", requestDialog.description);
    formData.append("region", requestDialog.region || "");
    if (requestDialog.image) {
      formData.append("image", requestDialog.image);
    }

    const result = await dispatch(sendStoreRequest(formData));

    if (sendStoreRequest.fulfilled.match(result)) {
      closeRequestDialog();
      setSuccessDialog({
        isOpen: true,
        message: t("تم إرسال طلبك بنجاح. سيتم مراجعته قريبًا."),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message:
          typeof result.payload === "string"
            ? result.payload
            : t("فشل إرسال الطلب. تحقق من البيانات."),
      });
    }
  };

  //  الموافقة على طلب
  const handleApprove = async (id) => {
    const result = await dispatch(approveStoreRequest(id));
    if (approveStoreRequest.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تمت الموافقة على الطلب"),
      });
    } else {
      setErrorDialog({ isOpen: true, message: t("فشل الموافقة") });
    }
  };

  //  Loading
  if (isLoading && stores.length === 0) {
    return (
      <div className="stores-page">
        <div className="stores-loading">{t('جاري التحميل')}...</div>
      </div>
    );
  }

  return (
    <div
      className="stores-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* Header */}
      <div className="stores-header">
        <div>
          <h1 className="stores-title">
            🏪 {t("المتاجر")}
            <span className="stores-badge">{stores.length}</span>
          </h1>
          <p className="stores-subtitle">
            {t("تصفح المتاجر أو افتح متجرك الخاص")}
          </p>
        </div>

        <div className="stores-actions">
          {canManage && (
            <button className="stores-add-btn" onClick={openAddDialog}>
              <span>➕</span>
              <span>{t("إضافة متجر")}</span>
            </button>
          )}

          <button className="stores-request-btn" onClick={openRequestDialog}>
            <span>🏪</span>
            <span>{t("افتح متجرك")}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {canManage && (
        <div className="stores-tabs">
          <button
            className={`stores-tab ${activeTab === "stores" ? "active" : ""}`}
            onClick={() => setActiveTab("stores")}
          >
            🏪 {t("المتاجر")} ({stores.length})
          </button>
          <button
            className={`stores-tab ${
              activeTab === "requests" ? "active" : ""
            }`}
            onClick={() => setActiveTab("requests")}
          >
            📬 {t("طلبات المتاجر")} ({requests.length})
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="stores-error">
          ⚠️ {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/*  Tab: Stores  */}
      {activeTab === "stores" && (
        <>
          {/* Search */}
          <div className="stores-search">
            <span className="stores-search-icon">🔍</span>
            <input
              type="text"
              className="stores-search-input"
              placeholder={t("ابحث عن متجر...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="stores-search-clear"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Grid */}
          {filteredStores.length === 0 ? (
            <div className="stores-empty">
              <div className="stores-empty-icon">🏪</div>
              <h3>{t("لا توجد متاجر")}</h3>
              <p>
                {search
                  ? t("لا توجد نتائج مطابقة للبحث")
                  : t("كن أول من يفتح متجرًا")}
              </p>
            </div>
          ) : (
            <div className="stores-grid">
              {filteredStores.map((store) => (
                <Link
                  to={`/stores/${store.id}`}
                  key={store.id}
                  className="store-card"
                >
                  <div className="store-card-image">
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
                      <div className="store-card-placeholder">🏪</div>
                    )}
                  </div>

                  <div className="store-card-info">
                    <h3 className="store-card-name">{store.name}</h3>

                    {/*  الرقم — فقط للمسؤولين */}
                    {canManage && store.phone && (
                      <span className="store-card-phone">
                        📞 {store.phone}
                      </span>
                    )}

                    {store.region && (
                      <span className="store-card-region">
                        📍 {store.region}
                      </span>
                    )}

                    {store.description && (
                      <p className="store-card-description">
                        {store.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="store-card-actions">
                      <button
                        className="store-action store-action-edit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditDialog(store);
                        }}
                        title={t("تعديل")}
                      >
                        ✏️
                      </button>
                      <button
                        className="store-action store-action-delete"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDeleteDialog(store, "store");
                        }}
                        title={t("حذف")}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/*  Tab: Requests  */}
      {activeTab === "requests" && canManage && (
        <>
          {requests.length === 0 ? (
            <div className="stores-empty">
              <div className="stores-empty-icon">📭</div>
              <h3>{t("لا توجد طلبات")}</h3>
            </div>
          ) : (
            <div className="stores-requests-list">
              {requests.map((req) => (
                <div key={req.id} className="store-request-card">
                  <div className="store-request-info">
                    <h3 className="store-request-name">{req.store_name}</h3>

                    {/*  الرقم — فقط للمسؤولين (هذه الصفحة أصلاً للمسؤولين) */}
                    {req.phone && (
                      <span className="store-request-phone">
                        📞 {req.phone}
                      </span>
                    )}

                    {req.region && (
                      <span className="store-request-region">
                        📍 {req.region}
                      </span>
                    )}

                    {req.description && (
                      <p className="store-request-description">
                        {req.description}
                      </p>
                    )}

                    <span className="store-request-date">
                      📅{" "}
                      {new Date(req.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="store-request-actions">
                    <button
                      className="store-request-btn store-request-approve"
                      onClick={() => handleApprove(req.id)}
                    >
                      ✅ {t("موافقة")}
                    </button>
                    <button
                      className="store-request-btn store-request-reject"
                      onClick={() => openDeleteDialog(req, "request")}
                    >
                      ❌ {t("رفض")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/*  Dialog إضافة/تعديل متجر  */}
      {formDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog dialog-form">
            <div className="dialog-header">
              <h3 className="dialog-title">
                {formDialog.mode === "add"
                  ? t("➕ إضافة متجر جديد")
                  : t("✏️ تعديل المتجر")}
              </h3>
              <button className="dialog-close" onClick={closeFormDialog}>
                ✕
              </button>
            </div>

            <form className="dialog-form-body" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">
                  {t("اسم المتجر")} *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("مثال: متجر الإلكترونيات")}
                  value={formDialog.name}
                  onChange={(e) =>
                    setFormDialog({ ...formDialog, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("رقم الهاتف")} *
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="09XXXXXXXX"
                  value={formDialog.phone}
                  onChange={(e) =>
                    setFormDialog({ ...formDialog, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("المنطقة")}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("مثال: دمشق")}
                  value={formDialog.region}
                  onChange={(e) =>
                    setFormDialog({ ...formDialog, region: e.target.value })
                  }
                />
                <span className="form-hint">💡 {t("اختياري")}</span>
              </div>

              <div className="form-group">
                <label className="form-label">{t("الوصف")} *</label>
                <textarea
                  className="form-textarea"
                  placeholder={t("وصف قصير للمتجر...")}
                  value={formDialog.description}
                  onChange={(e) =>
                    setFormDialog({
                      ...formDialog,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("صورة المتجر")} ({t("اختياري")})
                </label>

                {formDialog.imagePreview && (
                  <img
                    src={formDialog.imagePreview}
                    alt={t("معاينة")}
                    className="form-image-preview"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="form-input form-file-input"
                  onChange={handleFormImage}
                />
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="dialog-btn dialog-btn-cancel"
                  onClick={closeFormDialog}
                  disabled={isSaving}
                >
                  {t("إلغاء")}
                </button>
                <button
                  type="submit"
                  className="dialog-btn dialog-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving
                    ? t("جاري الحفظ...")
                    : formDialog.mode === "add"
                    ? t("إضافة")
                    : t("تعديل")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Dialog طلب فتح متجر  */}
      {requestDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog dialog-form">
            <div className="dialog-header">
              <h3 className="dialog-title">🏪 {t("افتح متجرك")}</h3>
              <button className="dialog-close" onClick={closeRequestDialog}>
                ✕
              </button>
            </div>

            <form className="dialog-form-body" onSubmit={handleSendRequest}>
              <div className="form-hint dialog-info-box">
                ℹ️ {t("سيتم مراجعة طلبك من قِبل المسؤولين قبل الموافقة.")}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("اسم المتجر")} *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("مثال: متجر الأزياء")}
                  value={requestDialog.store_name}
                  onChange={(e) =>
                    setRequestDialog({
                      ...requestDialog,
                      store_name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("رقم الهاتف")} *
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="09XXXXXXXX"
                  value={requestDialog.phone}
                  onChange={(e) =>
                    setRequestDialog({
                      ...requestDialog,
                      phone: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("المنطقة")}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("مثال: دمشق")}
                  value={requestDialog.region}
                  onChange={(e) =>
                    setRequestDialog({
                      ...requestDialog,
                      region: e.target.value,
                    })
                  }
                />
                <span className="form-hint">💡 {t("اختياري")}</span>
              </div>

              <div className="form-group">
                <label className="form-label">{t("الوصف")} *</label>
                <textarea
                  className="form-textarea"
                  placeholder={t("وصف قصير للمتجر...")}
                  value={requestDialog.description}
                  onChange={(e) =>
                    setRequestDialog({
                      ...requestDialog,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("صورة المتجر")} ({t("اختياري")})
                </label>

                {requestDialog.imagePreview && (
                  <img
                    src={requestDialog.imagePreview}
                    alt={t("معاينة")}
                    className="form-image-preview"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="form-input form-file-input"
                  onChange={handleRequestImage}
                />
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="dialog-btn dialog-btn-cancel"
                  onClick={closeRequestDialog}
                  disabled={isSending}
                >
                  {t("إلغاء")}
                </button>
                <button
                  type="submit"
                  className="dialog-btn dialog-btn-primary"
                  disabled={isSending}
                >
                  {isSending ? t("جاري الإرسال...") : t("إرسال الطلب")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Dialog تأكيد الحذف  */}
      {deleteDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">
              {deleteDialog.type === "store"
                ? t("تأكيد حذف المتجر")
                : t("تأكيد رفض الطلب")}
            </h3>
            <p className="dialog-message">
              {deleteDialog.type === "store"
                ? t("هل أنت متأكد من حذف المتجر")
                : t("هل أنت متأكد من رفض الطلب")}{" "}
              <strong>"{deleteDialog.name}"</strong>؟
              <br />
              {t("لا يمكن التراجع عن هذا الإجراء")}.
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() =>
                  setDeleteDialog({
                    isOpen: false,
                    id: null,
                    name: "",
                    type: "store",
                  })
                }
              >
                {t("إلغاء")}
              </button>
              <button
                className="dialog-btn dialog-btn-danger"
                onClick={confirmDelete}
              >
                {deleteDialog.type === "store" ? t("حذف") : t("رفض")}
              </button>
            </div>
          </div>
        </div>
      )}

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