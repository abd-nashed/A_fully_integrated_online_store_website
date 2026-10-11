import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../store/slices/categorySlice";
import { fetchStores } from "../store/slices/storesSlice";
import { useTranslation } from "react-i18next";
import { addToCart } from "../store/slices/cartSlice";
import {
  fetchProductsByCategory,
  addProduct,
  updateProduct,
  deleteProduct,
  clearProductsError,
} from "../store/slices/productsSlice";
import "../styles/ProductsByCategory.css";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://127.0.0.1:8000";

export default function ProductsByCategory() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const { products, isLoading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.category);
  const { stores } = useSelector((state) => state.stores);
  const currentUser = useSelector((state) => state.users.currentUser);

  const canManage =
    currentUser?.role === "superadmin" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "store";

  const currentCategory = categories.find(
    (c) => String(c.id) === String(categoryId)
  );

  //  الحالات
  const [search, setSearch] = useState("");

  //  حالة حفظ الإضافة/التعديل (لمنع الضغط المتكرر)
  const [isSaving, setIsSaving] = useState(false);

  const [formDialog, setFormDialog] = useState({
    isOpen: false,
    mode: "add",
    id: null,
    name: "",
    description: "",
    price: "",
    stock: "",
    category: categoryId || "",
    store: "",
    has_discount: false,
    discount_percent: "",
    is_active: true,
    main_image: null,
    main_imagePreview: "",
    image_1: null,
    image_2: null,
    image_3: null,
    image_4: null,
    image_5: null,
  });

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

  //  جلب المنتجات
  useEffect(() => {
    dispatch(fetchProductsByCategory(categoryId));

    if (categories.length === 0) {
      dispatch(fetchCategories());
    }

    if (stores.length === 0) {
      dispatch(fetchStores());
    }
  }, [dispatch, categoryId, categories.length, stores.length]);

  //  البحث + الترتيب
  const filtered = products
    .filter((p) => {
      const searchLower = search.toLowerCase();
      return (p.name || "").toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      if (a.is_active === b.is_active) return 0;
      return a.is_active ? -1 : 1;
    });

  //  فتح Dialog الإضافة
  const openAddDialog = () => {
    dispatch(clearProductsError());
    setFormDialog({
      isOpen: true,
      mode: "add",
      id: null,
      name: "",
      description: "",
      price: "",
      stock: "",
      category: categoryId || "",
      store: "",
      has_discount: false,
      discount_percent: "",
      is_active: true,
      main_image: null,
      main_imagePreview: "",
      image_1: null,
      image_2: null,
      image_3: null,
      image_4: null,
      image_5: null,
    });
  };

  //  فتح Dialog التعديل
  const openEditDialog = (product) => {
    dispatch(clearProductsError());
    setFormDialog({
      isOpen: true,
      mode: "edit",
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || categoryId || "",
      store: product.store || "",
      has_discount: product.has_discount || false,
      discount_percent: product.discount_percent || "",
      is_active: product.is_active ?? true,
      main_image: null,
      main_imagePreview: product.main_image?.startsWith("http")
        ? product.main_image
        : `${API_URL}${product.main_image}`,
      image_1: null,
      image_2: null,
      image_3: null,
      image_4: null,
      image_5: null,
    });
  };

  //  إغلاق Dialog
  const closeFormDialog = () => {
    setFormDialog({
      isOpen: false,
      mode: "add",
      id: null,
      name: "",
      description: "",
      price: "",
      stock: "",
      category: categoryId || "",
      store: "",
      has_discount: false,
      discount_percent: "",
      is_active: true,
      main_image: null,
      main_imagePreview: "",
      image_1: null,
      image_2: null,
      image_3: null,
      image_4: null,
      image_5: null,
    });
  };

  //  اختيار الصورة الرئيسية
  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormDialog({
        ...formDialog,
        main_image: file,
        main_imagePreview: URL.createObjectURL(file),
      });
    }
  };

  //  اختيار صورة إضافية
  const handleExtraImage = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setFormDialog({ ...formDialog, [key]: file });
    }
  };

  //  حفظ (إضافة أو تعديل)
  const handleSave = async (e) => {
    e.preventDefault();

    //  منع الضغط المتكرر
    if (isSaving) return;

    if (!formDialog.name.trim()) {
      setErrorDialog({ isOpen: true, message: t("يرجى إدخال اسم المنتج") });
      return;
    }

    if (formDialog.mode === "add" && !formDialog.main_image) {
      setErrorDialog({ isOpen: true, message: t("الصورة الرئيسية مطلوبة") });
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", formDialog.name);
    formData.append("description", formDialog.description || "");
    formData.append("price", String(formDialog.price));
    formData.append("stock", String(formDialog.stock));
    formData.append("category", String(formDialog.category));
    formData.append("has_discount", formDialog.has_discount ? "true" : "false");
    formData.append("is_active", formDialog.is_active ? "true" : "false");

    if (formDialog.store) {
      formData.append("store", String(formDialog.store));
    }

    if (formDialog.has_discount && formDialog.discount_percent) {
      formData.append("discount_percent", String(formDialog.discount_percent));
    }

    if (formDialog.main_image) {
      formData.append("main_image", formDialog.main_image);
    }
    if (formDialog.image_1) formData.append("image_1", formDialog.image_1);
    if (formDialog.image_2) formData.append("image_2", formDialog.image_2);
    if (formDialog.image_3) formData.append("image_3", formDialog.image_3);
    if (formDialog.image_4) formData.append("image_4", formDialog.image_4);
    if (formDialog.image_5) formData.append("image_5", formDialog.image_5);

    let result;
    if (formDialog.mode === "add") {
      result = await dispatch(addProduct(formData));
    } else {
      result = await dispatch(updateProduct({ id: formDialog.id, formData }));
    }

    setIsSaving(false); 

    if (
      addProduct.fulfilled.match(result) ||
      updateProduct.fulfilled.match(result)
    ) {
      dispatch(fetchProductsByCategory(categoryId));
      closeFormDialog();
      setSuccessDialog({
        isOpen: true,
        message:
          formDialog.mode === "add"
            ? t("تمت إضافة المنتج بنجاح")
            : t("تم تعديل المنتج بنجاح"),
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
  const openDeleteDialog = (product) => {
    setDeleteDialog({
      isOpen: true,
      id: product.id,
      name: product.name,
    });
  };

  //  تأكيد الحذف
  const confirmDelete = async () => {
    const result = await dispatch(deleteProduct(deleteDialog.id));

    setDeleteDialog({ isOpen: false, id: null, name: "" });

    if (deleteProduct.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تم حذف المنتج بنجاح"),
      });
    } else {
      setErrorDialog({
        isOpen: true,
        message: t("فشل حذف المنتج"),
      });
    }
  };

  //  Loading
  if (isLoading && products.length === 0) {
    return (
      <div className="products-page">
        <div className="products-loading">{t("جاري التحميل")}...</div>
      </div>
    );
  }

  return (
    <div
      className="products-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* Header */}
      <div className="products-header">
        <div>
          <button
            className="products-back-btn"
            onClick={() => navigate("/categories")}
          >
            ← {t("العودة للأقسام")}
          </button>
          <h1 className="products-title">
            {currentCategory?.name || t("منتجات القسم")}
          </h1>
          <p className="products-count">
            {filtered.length} {t("من")} {products.length} {t("منتج")}
          </p>
        </div>

        {canManage && (
          <button className="products-add-btn" onClick={openAddDialog}>
            <span>➕</span>
            <span>{t("إضافة منتج")}</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="products-error">
          ⚠️ {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/* Search */}
      <div className="products-search">
        <span className="products-search-icon">🔍</span>
        <input
          type="text"
          className="products-search-input"
          placeholder={t("ابحث عن منتج...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="products-search-clear"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="products-empty">
          <div className="products-empty-icon">📦</div>
          <p>{t("لا توجد منتجات في هذا القسم")}</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product) => {
            const hasDiscount = product.has_discount && product.discount_percent;
            const imageSrc = product.main_image?.startsWith("http")
              ? product.main_image
              : `${API_URL}${product.main_image}`;

            return (
              <div key={product.id} className="product-card">
                {/* Link */}
                <Link
                  to={`/products/${product.id}`}
                  className="product-card-link"
                >
                  {/* Actions */}
                  {canManage && (
                    <div className="product-card-actions">
                      <button
                        className="product-action product-action-edit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditDialog(product);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="product-action product-action-delete"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDeleteDialog(product);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  {/* Image */}
                  <div className="product-card-image">
                    <img src={imageSrc} alt={product.name} />

                    {hasDiscount && (
                      <span className="product-discount-badge">
                        -{product.discount_percent}%
                      </span>
                    )}

                    <span
                      className={`product-status-badge ${
                        product.is_active
                          ? "product-status-active"
                          : "product-status-inactive"
                      }`}
                    >
                      {product.is_active ? t("متاح") : t("غير متاح")}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="product-card-info">
                    <h3 className="product-card-name">{product.name}</h3>

                    <span className="product-card-category">
                      {product.category_name}
                    </span>

                    <div className="product-card-price">
                      {hasDiscount ? (
                        <>
                          <span className="product-price-final">
                            ${product.final_price}
                          </span>
                          <span className="product-price-old">
                            ${product.price}
                          </span>
                        </>
                      ) : (
                        <span className="product-price-final">
                          ${product.price}
                        </span>
                      )}
                    </div>

                    <span className="product-card-stock">
                      📦 {product.stock} {t("في المخزون")}
                    </span>
                  </div>
                </Link>

                {/* Footer — أضف للسلة */}
                <div className="product-card-footer">
                  <button
                    className="product-add-cart-btn"
                    disabled={!product.is_active || product.stock <= 0}
                    onClick={() => {
                      if (!product.is_active || product.stock <= 0) return;
                      dispatch(addToCart(product));
                    }}
                  >
                    {product.is_active && product.stock > 0 ? (
                      <>🛒 {t("أضف للسلة")}</>
                    ) : (
                      <>❌ {t("غير متاح")}</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog إضافة/تعديل */}
      {formDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog dialog-form dialog-form-large">
            <div className="dialog-header">
              <h3 className="dialog-title">
                {formDialog.mode === "add"
                  ? t("➕ إضافة منتج جديد")
                  : t("✏️ تعديل المنتج")}
              </h3>
              <button className="dialog-close" onClick={closeFormDialog}>
                ✕
              </button>
            </div>

            <form className="dialog-form-body" onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("اسم المنتج")}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('مثال: لابتوب Dell')}
                    value={formDialog.name}
                    onChange={(e) =>
                      setFormDialog({ ...formDialog, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("القسم")}</label>
                  <select
                    className="form-select"
                    value={formDialog.category}
                    onChange={(e) =>
                      setFormDialog({ ...formDialog, category: e.target.value })
                    }
                    required
                  >
                    <option value="">{t("اختر القسم")}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("المتجر")} ({t("اختياري")})
                </label>
                <select
                  className="form-select"
                  value={formDialog.store}
                  onChange={(e) =>
                    setFormDialog({ ...formDialog, store: e.target.value })
                  }
                >
                  <option value="">{t("بدون متجر")}</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  💡 {t("اختر المتجر الذي يعرض فيه المنتج إن وُجد")}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">{t("الوصف")}</label>
                <textarea
                  className="form-textarea"
                  placeholder={t("وصف المنتج...")}
                  value={formDialog.description}
                  onChange={(e) =>
                    setFormDialog({ ...formDialog, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("السعر")} ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formDialog.price}
                    onChange={(e) =>
                      setFormDialog({ ...formDialog, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("الكمية")}</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formDialog.stock}
                    onChange={(e) =>
                      setFormDialog({ ...formDialog, stock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group form-group-toggle">
                <label className="form-toggle-label">
                  <input
                    type="checkbox"
                    className="form-toggle-input"
                    checked={formDialog.has_discount}
                    onChange={(e) =>
                      setFormDialog({
                        ...formDialog,
                        has_discount: e.target.checked,
                        discount_percent: e.target.checked
                          ? formDialog.discount_percent
                          : "",
                      })
                    }
                  />
                  <span className="form-toggle-text">{t("هل عليه خصم؟")}</span>
                </label>
              </div>

              {formDialog.has_discount && (
                <div className="form-group">
                  <label className="form-label">{t("نسبة الخصم")} (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    className="form-input"
                    placeholder="20"
                    value={formDialog.discount_percent}
                    onChange={(e) =>
                      setFormDialog({
                        ...formDialog,
                        discount_percent: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group form-group-toggle">
                <label className="form-toggle-label">
                  <input
                    type="checkbox"
                    className="form-toggle-input"
                    checked={formDialog.is_active}
                    onChange={(e) =>
                      setFormDialog({
                        ...formDialog,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  <span className="form-toggle-text">{t("متاح للبيع")}</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("الصورة الرئيسية")} {formDialog.mode === "add" && "*"}
                </label>

                {formDialog.main_imagePreview && (
                  <img
                    src={formDialog.main_imagePreview}
                    alt={t("معاينة")}
                    className="form-image-preview"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="form-input form-file-input"
                  onChange={handleMainImage}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t("صور إضافية")} ({t("اختياري")})
                </label>
                <div className="form-images-grid">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input form-file-input"
                    onChange={(e) => handleExtraImage(e, "image_1")}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input form-file-input"
                    onChange={(e) => handleExtraImage(e, "image_2")}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input form-file-input"
                    onChange={(e) => handleExtraImage(e, "image_3")}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input form-file-input"
                    onChange={(e) => handleExtraImage(e, "image_4")}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input form-file-input"
                    onChange={(e) => handleExtraImage(e, "image_5")}
                  />
                </div>
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
                    ? t("إضافة منتج")
                    : t("تعديل منتج")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog تأكيد الحذف */}
      {deleteDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">{t("تأكيد الحذف")}</h3>
            <p className="dialog-message">
              {t("هل أنت متأكد من حذف المنتج")}{" "}
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

      {/* Dialog النجاح */}
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

      {/* Dialog الخطأ */}
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