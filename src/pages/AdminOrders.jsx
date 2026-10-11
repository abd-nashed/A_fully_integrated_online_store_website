import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  deleteAllOrders,
  fetchDailySales,
  clearOrdersError,
} from "../store/slices/ordersSlice";
import "../styles/AdminOrders.css";

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { orders, isLoading, error, dailySales } = useSelector(
    (state) => state.orders
  );
  const currentUser = useSelector((state) => state.users.currentUser);

  const lang = useSelector((state) => state.lang.lang);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const canManage = ["superadmin", "admin", "sales"].includes(
    currentUser?.role
  );

  const canViewSales = ["superadmin", "admin"].includes(currentUser?.role);
  const canDeleteAll = ["superadmin", "admin"].includes(currentUser?.role);

  //  الحالات
  const [search, setSearch] = useState("");

  const [productsDialog, setProductsDialog] = useState({
    isOpen: false,
    order: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const [deleteAllDialog, setDeleteAllDialog] = useState({
    isOpen: false,
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
    if (canManage) {
      dispatch(fetchOrders());
    }
  }, [dispatch, canManage]);

  useEffect(() => {
    if (canViewSales) {
      dispatch(fetchDailySales());
    }
  }, [dispatch, canViewSales]);

  //  البحث
  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      (o.full_name || "").toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q) ||
      (o.tracking_code || "").toLowerCase().includes(q)
    );
  });

  //  تعديل الحالة
  const handleUpdateStatus = async (id, status) => {
    const result = await dispatch(updateOrderStatus({ id, status }));

    if (updateOrderStatus.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تم تحديث حالة الطلب"),
      });
      if (canViewSales) {
        dispatch(fetchDailySales());
      }
    } else {
      setErrorDialog({ isOpen: true, message: t("فشل التحديث") });
    }
  };

  //  حذف واحد
  const openDeleteDialog = (order) => {
    setDeleteDialog({
      isOpen: true,
      id: order.id,
      name: order.full_name,
    });
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ isOpen: false, id: null, name: "" });

    const result = await dispatch(deleteOrder(id));
    if (deleteOrder.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t("تم حذف الطلب"),
      });
    } else {
      setErrorDialog({ isOpen: true, message: t("فشل الحذف") });
    }
  };

  //   حذف كل الطلبات
  const openDeleteAllDialog = () => {
    setDeleteAllDialog({ isOpen: true });
  };

  const confirmDeleteAll = async () => {
    setDeleteAllDialog({ isOpen: false });

    const result = await dispatch(deleteAllOrders());
    if (deleteAllOrders.fulfilled.match(result)) {
      setSuccessDialog({
        isOpen: true,
        message: t(`${t('تم حذف')} ${result.payload.deleted_count} ${t('طلب بنجاح')}`),
      });
    } else {
      setErrorDialog({ isOpen: true, message: t("فشل حذف الطلبات") });
    }
  };

  //  إجمالي 7 أيام
  const totalSevenDays = dailySales.reduce(
    (sum, day) => sum + (day.total || 0),
    0
  );

  //  حماية الصفحة
  if (!canManage) {
    return (
      <div className="ao-page">
        <div className="ao-no-access">
          <div className="ao-no-access-icon">🚫</div>
          <h2>{t("غير مصرح لك بالوصول")}</h2>
        </div>
      </div>
    );
  }

  //  Loading
  if (isLoading && orders.length === 0) {
    return (
      <div className="ao-page">
        <div className="ao-loading">{t("جاري التحميل")}...</div>
      </div>
    );
  }

  return (
    <div
      className="ao-page"
      style={{ direction: lang === "ar" ? "ltr" : "rtl" }}
    >
      {/* Header */}
      <div className="ao-header">
        <div>
          <h1 className="ao-title">
            📋 {t("الطلبات")}
            <span className="ao-badge">{orders.length}</span>
          </h1>
          <p className="ao-subtitle">
            {t("إدارة طلبات الزبائن وتتبع حالتها")}
          </p>
        </div>

        {canDeleteAll && orders.length > 0 && (
          <button
            className="ao-delete-all-btn"
            onClick={openDeleteAllDialog}
          >
            🗑️ {t("حذف كل الطلبات")}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="ao-error">
          ⚠️ {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/* Search */}
      <div className="ao-search">
        <span className="ao-search-icon">🔍</span>
        <input
          type="text"
          className="ao-search-input"
          placeholder={t("ابحث بالاسم أو الرقم أو كود التتبع...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="ao-search-clear" onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="ao-empty">
          <div className="ao-empty-icon">📭</div>
          <h3>{t("لا توجد طلبات")}</h3>
          <p>
            {search
              ? t("لا توجد نتائج مطابقة للبحث")
              : t("لم يستقبل الموقع طلبات بعد")}
          </p>
        </div>
      ) : (
        <div className="ao-list">
          {filtered.map((order) => {
            const isPending = order.status === "pending";
            const isShipped = order.status === "shipped";
            const isDelivered = order.status === "delivered";

            return (
              <div key={order.id} className="ao-card">
                <div className="ao-card-header">
                  <div className="ao-card-info">
                    <div className="ao-card-avatar">
                      {order.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="ao-card-name">{order.full_name}</h3>
                      <div className="ao-card-meta">
                        <span>📞 {order.phone}</span>
                        <span>🔍 {order.tracking_code}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`ao-status ao-status-${order.status}`}>
                    {order.status_display}
                  </span>
                </div>

                <div className="ao-card-address">📍 {order.address}</div>

                <div className="ao-card-footer">
                  <div className="ao-card-info-bottom">
                    <span className="ao-card-date">
                      📅{" "}
                      {new Date(order.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="ao-card-total">💰 ${order.total}</span>
                  </div>

                  <div className="ao-card-actions">
                    <button
                      className="ao-btn ao-btn-view"
                      onClick={() =>
                        setProductsDialog({ isOpen: true, order })
                      }
                    >
                      📦 {t("عرض المنتجات")}
                    </button>

                    {isPending && (
                      <button
                        className="ao-btn ao-btn-ship"
                        onClick={() => handleUpdateStatus(order.id, "shipped")}
                      >
                        🚚 {t("تم الإرسال")}
                      </button>
                    )}

                    {isShipped && (
                      <button
                        className="ao-btn ao-btn-deliver"
                        onClick={() =>
                          handleUpdateStatus(order.id, "delivered")
                        }
                      >
                        ✅ {t("تم البيع")}
                      </button>
                    )}

                    {isDelivered && (
                      <span className="ao-done-label">✅ {t("تم البيع")}</span>
                    )}

                    <button
                      className="ao-btn ao-btn-delete"
                      onClick={() => openDeleteDialog(order)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*  قسم مبيعات آخر 7 أيام  */}
      {canViewSales && (
        <div className="ao-sales-section">
          <div className="ao-sales-header">
            <h2 className="ao-sales-title">💰 {t("مبيعات آخر 7 أيام")}</h2>
            <span className="ao-sales-hint">
              {t("تُحذف تلقائيًا بعد 7 أيام")}
            </span>
          </div>

          {dailySales.length === 0 ? (
            <div className="ao-sales-empty">
              {t("لا توجد مبيعات مسجّلة")}
            </div>
          ) : (
            <>
              <div className="ao-sales-grid">
                {dailySales.map((day, index) => {
                  const isToday =
                    new Date(day.date).toDateString() ===
                    new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`ao-sales-card ${
                        isToday ? "ao-sales-today" : ""
                      }`}
                    >
                      <div className="ao-sales-date">
                        {isToday && "🔴 "}
                        {new Date(day.date).toLocaleDateString("ar-EG", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="ao-sales-total">
                        ${day.total.toFixed(2)}
                      </div>
                      <div className="ao-sales-count">
                        📦 {day.orders_count} {t("طلب")}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ao-sales-grand-total">
                <span>{t("إجمالي 7 أيام")}</span>
                <span>${totalSevenDays.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/*  Dialog عرض المنتجات  */}
      {productsDialog.isOpen && productsDialog.order && (
        <div className="dialog-overlay">
          <div className="dialog dialog-form dialog-form-large">
            <div className="dialog-header">
              <h3 className="dialog-title">
                📦 {t("منتجات الطلب")} #{productsDialog.order.id}
              </h3>
              <button
                className="dialog-close"
                onClick={() =>
                  setProductsDialog({ isOpen: false, order: null })
                }
              >
                ✕
              </button>
            </div>

            <div className="dialog-form-body">
              <div className="ao-products-list">
                {productsDialog.order.items?.map((item) => (
                  <div key={item.id} className="ao-product-item">
                    <div className="ao-product-info">
                      <h4 className="ao-product-name">{item.product_name}</h4>
                      {item.store_name && (
                        <span className="ao-product-store">
                          🏪 {item.store_name}
                        </span>
                      )}
                    </div>

                    <div className="ao-product-details">
                      <span className="ao-product-qty">× {item.quantity}</span>
                      <span className="ao-product-price">
                        ${item.subtotal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ao-products-total">
                <span>{t("الإجمالي")}</span>
                <span>${productsDialog.order.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Dialog تأكيد حذف واحد  */}
      {deleteDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">⚠️</div>
            <h3 className="dialog-title">{t("تأكيد الحذف")}</h3>
            <p className="dialog-message">
              {t("هل أنت متأكد من حذف طلب")}{" "}
              <strong>"{deleteDialog.name}"</strong>؟<br />
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

      {/*  Dialog تأكيد حذف الكل */}
      {deleteAllDialog.isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon dialog-icon-danger">🚨</div>
            <h3 className="dialog-title">
              {t("تأكيد حذف كل الطلبات")}
            </h3>
            <p className="dialog-message">
              {t(`${t("هل أنت متأكد من حذف كل الطلبات")} (${orders.length})؟`)}
              <br />
              <strong>{t("لا يمكن التراجع عن هذا الإجراء")}!</strong>
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() => setDeleteAllDialog({ isOpen: false })}
              >
                {t("إلغاء")}
              </button>
              <button
                className="dialog-btn dialog-btn-danger"
                onClick={confirmDeleteAll}
              >
                🗑️ {t("حذف الكل")}
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