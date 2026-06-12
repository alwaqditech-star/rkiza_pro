"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconEdit,
  IconInbox,
  IconPlus,
  IconTrash,
  IconUserPlus,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import { calcEmployeeTotals } from "@/lib/employee-utils";
import { fmtAmt, fmtDate, today } from "@/lib/format";
import { employeesFilename } from "@/lib/export-filenames";
import type { Employee, EmployeeStatus } from "@/lib/types";
import { useClientPermissions } from "./ClientPermissionsContext";
import { ReportExportButtons } from "./ReportExportButtons";

const emptyForm = {
  name: "",
  job_title: "",
  id_number: "",
  hire_date: today(),
  basic_salary: "",
  housing_allowance: "",
  transport_allowance: "",
  commission: "",
  gosi_percent: "9",
  status: "active" as EmployeeStatus,
};

function statusBadge(status: EmployeeStatus) {
  if (status === "active") return <span className="badge badge-emerald">نشط</span>;
  if (status === "leave") return <span className="badge badge-gold">إجازة</span>;
  return <span className="badge badge-ruby">غير نشط</span>;
}

export function EmployeesClient() {
  const { canWrite, canDelete } = useClientPermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/client/employees");
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const previewTotals = calcEmployeeTotals({
    basic_salary: Number(form.basic_salary || 0),
    housing_allowance: Number(form.housing_allowance || 0),
    transport_allowance: Number(form.transport_allowance || 0),
    commission: Number(form.commission || 0),
    gosi_percent: Number(form.gosi_percent || 9),
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditId(employee.id);
    setForm({
      name: employee.name,
      job_title: employee.job_title,
      id_number: employee.id_number ?? "",
      hire_date: employee.hire_date ?? today(),
      basic_salary: String(employee.basic_salary),
      housing_allowance: String(employee.housing_allowance),
      transport_allowance: String(employee.transport_allowance),
      commission: String(employee.commission),
      gosi_percent: String(employee.gosi_percent),
      status: employee.status,
    });
    setMessage("");
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      job_title: form.job_title.trim(),
      id_number: form.id_number.trim(),
      hire_date: form.hire_date,
      basic_salary: Number(form.basic_salary),
      housing_allowance: Number(form.housing_allowance || 0),
      transport_allowance: Number(form.transport_allowance || 0),
      commission: Number(form.commission || 0),
      gosi_percent: Number(form.gosi_percent || 9),
      status: form.status,
    };

    const url = editId ? `/api/client/employees/${editId}` : "/api/client/employees";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.message ?? "فشل الحفظ");
      return;
    }

    setModalOpen(false);
    loadEmployees();
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا الموظف؟")) return;
    const res = await apiFetch(`/api/client/employees/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) loadEmployees();
    else alert(json.message ?? "فشل الحذف");
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <IconUsersGroup size={18} stroke={1.8} />
            سجلات الموظفين
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <ReportExportButtons
              disabled={loading || employees.length === 0}
              buildExportUrl={(format) => `/api/client/employees/export-${format}`}
              buildFilename={(extension) => employeesFilename(extension)}
            />
            {canWrite ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                <IconPlus size={14} />
                إضافة موظف
              </button>
            ) : null}
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الموظف</th>
                <th>المسمى الوظيفي</th>
                <th>الراتب الأساسي</th>
                <th>بدل السكن</th>
                <th>بدل المواصلات</th>
                <th>إجمالي الراتب</th>
                <th>تاريخ التعيين</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10}>
                    <div className="tbl-empty">جاري التحميل...</div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="tbl-empty">
                      <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
                      لا يوجد موظفون مسجلون
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr key={employee.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 700 }}>{employee.name}</td>
                    <td>{employee.job_title}</td>
                    <td style={{ direction: "ltr", textAlign: "right", fontWeight: 700 }}>
                      {fmtAmt(employee.basic_salary)}
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {fmtAmt(employee.housing_allowance)}
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {fmtAmt(employee.transport_allowance)}
                    </td>
                    <td
                      style={{
                        direction: "ltr",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--teal-dark)",
                      }}
                    >
                      {fmtAmt(employee.gross_salary)}
                    </td>
                    <td>{employee.hire_date ? fmtDate(employee.hire_date) : "—"}</td>
                    <td>{statusBadge(employee.status)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {canWrite ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(employee)}
                          title="تعديل"
                        >
                          <IconEdit size={14} />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(employee.id)}
                          title="حذف"
                        >
                          <IconTrash size={14} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-overlay${modalOpen ? " open" : ""}`}>
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title">
              <IconUserPlus size={18} stroke={1.8} />
              {editId ? "تعديل موظف" : "إضافة موظف"}
            </div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
              <IconX size={16} />
            </button>
          </div>
          <div className="modal-body">
            {message ? (
              <div style={{ color: "var(--ruby)", fontSize: 13, marginBottom: 12 }}>{message}</div>
            ) : null}
            <div className="form-grid">
              <div className="form-group form-full">
                <label>اسم الموظف الكامل *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="الاسم الرباعي"
                />
              </div>
              <div className="form-group">
                <label>المسمى الوظيفي *</label>
                <input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>رقم الهوية</label>
                <input
                  value={form.id_number}
                  onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>تاريخ التعيين</label>
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>الراتب الأساسي (ر.س) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.basic_salary}
                  onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>بدل السكن (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.housing_allowance}
                  onChange={(e) => setForm({ ...form, housing_allowance: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>بدل المواصلات (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.transport_allowance}
                  onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>العمولات (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.commission}
                  onChange={(e) => setForm({ ...form, commission: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>نسبة التأمينات (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.gosi_percent}
                  onChange={(e) => setForm({ ...form, gosi_percent: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as EmployeeStatus })
                  }
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="leave">إجازة</option>
                </select>
              </div>
              <div className="form-group form-full">
                <label>إجمالي الراتب المحسوب</label>
                <div style={{ fontWeight: 700, color: "var(--teal-dark)" }}>
                  {fmtAmt(previewTotals.gross_salary)} ر.س
                </div>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              إلغاء
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              حفظ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
