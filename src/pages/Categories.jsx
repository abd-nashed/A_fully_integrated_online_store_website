import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  clearError,
} from "../store/slices/categorySlice";
import "../styles/Categories.css";

export default function Categories() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const { categories, isLoading, error } = useSelector(
    (state) => state.category
  );

  //  المستخدم الحالي
  const currentUser = useSelector((state) => state.users.currentUser);

  //  هل يمكنه الإدارة؟
  const canManage =
    currentUser?.role === "superadmin" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "store";

  //  الحالات
  const [search, setSearch] = useState("");

  //  حالة حفظ الإضافة/التعديل (لمنع الضغط المتكرر)
  const [isSaving, setIsSaving] = useState(false);

  const [formDialog, setFormDialog] = useState({
    isOpen: false,
    mode: "add",
    id: null,
    name: "",
    details: "",
    image: null,
    imagePreview: "",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  //  Dialog النجاح
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: "",
  });

  //  Dialog الخطأ
  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  const API_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://127.0.0.1:8000";

  //  جلب الأقسام عند فتح الصفحة
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  //  البحث
  const filtered = categories.filter((c) => {
    const searchLower = search.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const details = (c.details || "").toLowerCase();
    return name.includes(searchLower) || details.includes(searchLower);
  });

  //  فتح Dialog الإضافة
  const openAddDialog = () => {
    if (dispatch && clearError) dispatch(clearError());
    setFormDialog({
      isOpen: true,
      mode: "add",
      id: null,
      name: "",
      details: "",
      image: null,
      imagePreview: "",
    });
  };

  //  فتح Dialog التعديل
  const openEditDialog = (category) => {
    if (dispatch && clearError) dispatch(clearError());
    setFormDialog({
      isOpen: true,
      mode: "edit",
      id: category.id,
      name: category.name,
      details: category.details || "",
      image: null,
      imagePreview: category.image?.startsWith("http")
        ? category.image
        : `${API_URL}${category.image}`,
    });
  };

  //  إغلاق Dialog
  const closeFormDialog = () => {
    setFormDialog({
      isOpen: false,
      mode: "add",
      id: null,
      name: "",
      details: "",
      image: null,
      imagePreview: "",
    });
  };

  //  اختيار صورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormDialog({
        ...formDialog,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  //  حفظ (إضافة أو تعديل)
  const handleSave = async (e) => {
    e.preventDefault();

    //  منع الضغط المتكرر
    if (isSaving) return;

    if (!formDialog.name.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال اسم القسم") });
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", formDialog.name);
    formData.append("details", formDialog.details);

    if (formDialog.image) {
      formData.append("image", formDialog.image);
    }

    let result;
    if (formDialog.mode === "add") {
      result = await dispatch(addCategory(formData));
    } else {
      result = await dispatch(updateCategory({ id: formDialog.id, formData }));
    }

    setIsSaving(false);

    if (
      addCategory.fulfilled.match(result) ||
      updateCategory.fulfilled.match(result)
    ) {
      closeFormDialog();
      setSuccessDialog({
        isOpen: true,
        message:
          formDialog.mode === "add"
            ? t("تمت إضافة القسم بنجاح")
            : t("تم تعديل القسم بنجاح"),
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

  //  فتح Dialog الحذف
  const openDeleteDialog = (category) => {
    setDeleteDialog({
      isOpen: true,
      id: category.id,
      name: category.name,
    });
  };

  //  تأكيد الحذف
  const confirmDelete = async () => {
    const result = await dispatch(deleteCategory(deleteDialog.id));

    setDeleteDialog({ isOpen: false, id: null, name: "" });

    if (deleteCategory.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تم حذف القسم بنجاح"),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message:
          result.payload || t("فشل حذف القسم. قد يكون القسم يحتوي على منتجات."),
      });
    }
  };

  //  Loading
  if (isLoading && categories.length === 0) {
    return (
      <div className="categories-page">
        <div className="categories-loading">{t("جاري التحميل")}...</div>
      </div>
    );
  }

  return (
    <div
      className="categories-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/*  Header  */}
      <div className="categories-header">
        <div>
          <h1 className="categories-title">{t("الأقسام")}</h1>
          <p className="categories-count">
            {filtered.length} {t("من")} {categories.length} {t("قسم")}
          </p>
        </div>

        {canManage && (
          <button className="categories-add-btn" onClick={openAddDialog}>
            <span>➕</span>
            <span>{t("إضافة قسم")}</span>
          </button>
        )}
      </div>

      {/*  Error Banner  */}
      {error && (
        <div className="categories-error">
          ⚠️ {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/*  Search  */}
      <div className="categories-search">
        <span className="categories-search-icon">🔍</span>
        <input
          type="text"
          className="categories-search-input"
          placeholder={t("ابحث عن قسم...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="categories-search-clear"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

      {/*  Grid  */}
      {filtered.length === 0 ? (
        <div className="categories-empty">
          <div className="categories-empty-icon">🔍</div>
          <p>{t("لا توجد نتائج مطابقة للبحث")}</p>
        </div>
      ) : (
        <div className="categories-grid">
          {filtered.map((category) => (
            <Link
              to={`/categories/${category.id}/products`}
              key={category.id}
              className="category-card"
            >
              {canManage && (
                <div className="category-card-actions">
                  <button
                    className="category-action category-action-edit"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditDialog(category);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="category-action category-action-delete"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDeleteDialog(category);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}

              <div className="category-card-image">
                <img
                  src={
                    category.image?.startsWith("http")
                      ? category.image
                      : `${API_URL}${category.image}`
                  }
                  alt={category.name}
                />
              </div>

              <div className="category-card-info">
                <h3 className="category-card-name">{category.name}</h3>
                <p className="category-card-description">
                  {category.details}
                </p>
                <span className="category-card-products">
                  📦 {category.products_count || 0} {t("منتج")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/*  Dialog إضافة/تعديل  */}
      {formDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog dialog-form">
            <div className="dialog-header">
              <h3 className="dialog-title">
                {formDialog.mode === "add"
                  ? t("➕ إضافة قسم جديد")
                  : t("✏️ تعديل القسم")}
              </h3>
              <button className="dialog-close" onClick={closeFormDialog}>
                ✕
              </button>
            </div>

            <form className="dialog-form-body" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">{t("اسم القسم")}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t("مثال: إلكترونيات")}
                  value={formDialog.name}
                  onChange={(e) =>
                    setFormDialog({ ...formDialog, name: e.target.value })
                  }
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("الوصف")}</label>
                <textarea
                  className="form-textarea"
                  placeholder={t("اكتب وصفاً قصيراً للقسم...")}
                  value={formDialog.details}
                  onChange={(e) =>
                    setFormDialog({
                      ...formDialog,
                      details: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("الصورة")}</label>

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
                  onChange={handleImageChange}
                />
                <span className="form-hint">
                  💡 {t("اختر صورة من جهازك")}
                </span>
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

      {/*  Dialog تأكيد الحذف  */}
      {deleteDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">{t("تأكيد الحذف")}</h3>
            <p className="dialog-message">
              {t("هل أنت متأكد من حذف القسم")}{" "}
              <strong>"{deleteDialog.name}"</strong>؟
              <br />
              {t("لا يمكن التراجع عن هذا الإجراء")}.
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
                {t("حذف")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Dialog النجاح */}
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

      {/*  Dialog الخطأ */}
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