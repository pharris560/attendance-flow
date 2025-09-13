// src/pages/Students.tsx
import React, { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useApp } from "../contexts/AppContext";

type Student = {
  id: string | number;
  name: string;
  className?: string;
  attendance?: "Present" | "Absent" | "Tardy" | "Excused Absence" | "Excused Tardy";
  [key: string]: any;
};

type ClassRow = {
  id: string | number;
  name: string;
};

type ConfirmProps = {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmModal: React.FC<ConfirmProps> = ({
  open,
  title = "Delete student?",
  message = "This action cannot be undone.",
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

type StudentFormProps = {
  open: boolean;
  initial?: Partial<Student>;
  classes: ClassRow[];
  onCancel: () => void;
  onSave: (data: { name: string; className?: string; attendance?: Student["attendance"] }) => void;
};

const StudentFormModal: React.FC<StudentFormProps> = ({
  open,
  initial,
  classes,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [className, setClassName] = useState<string>(initial?.className ?? "");
  const [attendance, setAttendance] = useState<Student["attendance"]>(
    initial?.attendance ?? "Present"
  );

  React.useEffect(() => {
    setName(initial?.name ?? "");
    setClassName(initial?.className ?? "");
    setAttendance(initial?.attendance ?? "Present");
  }, [initial?.name, initial?.className, initial?.attendance, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {initial?.id ? "Edit Student" : "Add Student"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jordan Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={String(c.id)} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attendance</label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={attendance ?? "Present"}
              onChange={(e) => setAttendance(e.target.value as Student["attendance"])}
            >
              <option>Present</option>
              <option>Absent</option>
              <option>Tardy</option>
              <option>Excused Absence</option>
              <option>Excused Tardy</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, className, attendance })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Students: React.FC = () => {
  const { students, classes, addStudent, updateStudent, deleteStudent } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Student | null>(null);

  const classOptions: ClassRow[] = useMemo(() => {
    if (Array.isArray(classes) && classes.length > 0) {
      const first = classes[0] as any;
      if (typeof first === "string") {
        return (classes as string[]).map((name, idx) => ({ id: idx, name }));
      }
      return (classes as any[]).map((c, idx) => ({
        id: c.id ?? idx,
        name: c.name ?? String(c),
      }));
    }
    return [];
  }, [classes]);

  const filtered: Student[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (students as Student[]).filter((s) => {
      const matchTerm =
        !term ||
        s.name?.toLowerCase().includes(term) ||
        s.className?.toLowerCase().includes(term);
      const matchClass = !selectedClass || s.className === selectedClass;
      return matchTerm && matchClass;
    });
  }, [students, searchTerm, selectedClass]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (s: Student) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleSave = (data: { name: string; className?: string; attendance?: Student["attendance"] }) => {
    if (editing?.id != null) {
      updateStudent(editing.id, data);
    } else {
      addStudent({
        id: `${Date.now()}`,
        name: data.name,
        className: data.className,
        attendance: data.attendance,
      });
    }
    setFormOpen(false);
    setEditing(null);
  };

  const askDelete = (s: Student) => {
    setToDelete(s);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (toDelete?.id != null) {
      deleteStudent(toDelete.id);
    }
    setConfirmOpen(false);
    setToDelete(null);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
            <input
              className="w-full border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <select
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All classes</option>
            {classOptions.map((c) => (
              <option key={String(c.id)} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Class</th>
              <th className="text-left px-4 py-3 font-medium">Attendance</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={String(s.id)} className="border-t">
                  <td className="px-4 py-3">{s.name ?? "—"}</td>
                  <td className="px-4 py-3">{s.className ?? "—"}</td>
                  <td className="px-4 py-3">{s.attendance ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-gray-50"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => askDelete(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StudentFormModal
        open={formOpen}
        initial={editing ?? undefined}
        classes={classOptions}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <DeleteConfirmModal open={confirmOpen} onCancel={cancelDelete} onConfirm={confirmDelete} />
    </div>
  );
};

export default Students;
