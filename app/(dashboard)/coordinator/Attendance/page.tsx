"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceRow = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
};

type AttendancePayload = {
  phoneNumber: string;
  attended: boolean;
};

type TraineeDraft = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
};

const MOCK_TRAINEES: AttendanceRow[] = [
  {
    id: "trainee-001",
    name: "Abel Worku",
    phoneNumber: "+251-911-220-331",
    email: "abel.worku@share.local",
  },
  {
    id: "trainee-002",
    name: "Meron Hailu",
    phoneNumber: "+251-922-110-442",
    email: "meron.hailu@share.local",
  },
  {
    id: "trainee-003",
    name: "Yonas Fikru",
    phoneNumber: "+251-933-340-228",
    email: "yonas.fikru@share.local",
  },
  {
    id: "trainee-004",
    name: "Rahel Assefa",
    phoneNumber: "+251-944-512-178",
    email: "rahel.assefa@share.local",
  },
];

const createEmptyTrainee = (id: number): TraineeDraft => ({
  id: `row-${id}`,
  name: "",
  phoneNumber: "",
  email: "",
});

const getInitialAttendance = (trainees: AttendanceRow[]) =>
  trainees.reduce<Record<string, boolean>>((acc, trainee) => {
    acc[trainee.phoneNumber] = false;
    return acc;
  }, {});

export default function CoordinatorAttendancePage() {
  const [trainees, setTrainees] = useState<AttendanceRow[]>(MOCK_TRAINEES);
  const [attendanceByPhone, setAttendanceByPhone] = useState<Record<string, boolean>>(
    () => getInitialAttendance(MOCK_TRAINEES)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [draftRows, setDraftRows] = useState<TraineeDraft[]>([
    createEmptyTrainee(1),
    createEmptyTrainee(2),
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const payload = useMemo<AttendancePayload[]>(
    () =>
      trainees.map((trainee) => ({
        phoneNumber: trainee.phoneNumber,
        attended: Boolean(attendanceByPhone[trainee.phoneNumber]),
      })),
    [attendanceByPhone, trainees]
  );

  const attendedCount = useMemo(
    () => payload.filter((item) => item.attended).length,
    [payload]
  );

  const canCreate = useMemo(
    () =>
      createDate.trim().length > 0 &&
      draftRows.some(
        (row) => row.name.trim() && row.phoneNumber.trim() && row.email.trim()
      ),
    [createDate, draftRows]
  );

  const setCreateDateToToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setCreateDate(`${yyyy}-${mm}-${dd}`);
  };

  const toggleAttendance = (phoneNumber: string, checked: boolean) => {
    setAttendanceByPhone((prev) => ({
      ...prev,
      [phoneNumber]: checked,
    }));
  };

  const handleSubmitAttendance = async () => {
    try {
      setIsSubmitting(true);

      await fetch("/api/coordinator/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Attendance payload sent:", payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateDate("");
    setDraftRows([createEmptyTrainee(1), createEmptyTrainee(2)]);
  };

  const updateDraftRow = (
    id: string,
    field: keyof Omit<TraineeDraft, "id">,
    value: string
  ) => {
    setDraftRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addDraftRow = () => {
    setDraftRows((prev) => [...prev, createEmptyTrainee(prev.length + 1)]);
  };

  const removeDraftRow = (id: string) => {
    setDraftRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  };

  const handleCreateTrainees = async () => {
    if (!createDate.trim()) {
      window.alert("Please select a date before creating trainees.");
      return;
    }

    if (!canCreate) {
      window.alert("Please fill at least one complete trainee row.");
      return;
    }

    const cleanedRows = draftRows
      .map((row) => ({
        name: row.name.trim(),
        phoneNumber: row.phoneNumber.trim(),
        email: row.email.trim(),
      }))
      .filter((row) => row.name && row.phoneNumber && row.email);

    const createPayload = {
      date: createDate,
      trainees: cleanedRows,
    };

    try {
      setIsCreating(true);

      await fetch("/api/coordinator/attendance/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const newRows: AttendanceRow[] = cleanedRows.map((row, index) => ({
        id: `trainee-${Date.now()}-${index}`,
        name: row.name,
        phoneNumber: row.phoneNumber,
        email: row.email,
      }));

      setTrainees((prev) => [...prev, ...newRows]);
      setAttendanceByPhone((prev) => {
        const next = { ...prev };
        newRows.forEach((row) => {
          if (next[row.phoneNumber] === undefined) {
            next[row.phoneNumber] = false;
          }
        });
        return next;
      });

      console.log("Create trainees payload:", createPayload);

      setCreateOpen(false);
      resetCreateForm();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-bold tracking-tight text-black">
              Attendance
            </h1>
            <p className="font-medium text-zinc-500">
              Mark attendance for your trainees
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(true)}
              className="h-11 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Trainee
            </Button>

            <Button
              type="button"
              onClick={handleSubmitAttendance}
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-[#3B82F6] px-6 font-bold text-white shadow-md hover:bg-blue-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Attendance
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
          <div className="mb-6 flex flex-col gap-1 text-xs font-bold text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Total: {trainees.length} Trainees</span>
            <span>Marked Attended: {attendedCount}</span>
          </div>

          <div className="grid gap-3 md:hidden">
            {trainees.map((trainee) => (
              <div
                key={trainee.id}
                className="rounded-2xl border border-gray-100 bg-white p-4"
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-gray-700">{trainee.name}</div>
                  <div className="text-xs font-medium text-gray-500">{trainee.phoneNumber}</div>
                  <div className="break-all text-xs font-medium text-gray-500">{trainee.email}</div>
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <label className="inline-flex h-8 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-[11px] font-bold text-emerald-700">
                    <Checkbox
                      checked={attendanceByPhone[trainee.phoneNumber]}
                      onCheckedChange={(checked) =>
                        toggleAttendance(trainee.phoneNumber, checked === true)
                      }
                    />
                    Attended
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 md:block">
            <Table className="min-w-180">
              <TableHeader className="bg-[#D6E6F2]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
                    Name
                  </TableHead>
                  <TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
                    Phone
                  </TableHead>
                  <TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
                    Email
                  </TableHead>
                  <TableHead className="h-12 px-6 text-right text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainees.map((trainee) => (
                  <TableRow
                    key={trainee.id}
                    className="border-gray-50 hover:bg-slate-50/50"
                  >
                    <TableCell className="px-6 py-5 font-bold text-gray-700 sm:px-8">
                      {trainee.name}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
                      {trainee.phoneNumber}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
                      {trainee.email}
                    </TableCell>
                    <TableCell className="px-6 py-5 sm:px-8">
                      <div className="flex items-center justify-end">
                        <label className="inline-flex h-8 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-[11px] font-bold text-emerald-700">
                          <Checkbox
                            checked={attendanceByPhone[trainee.phoneNumber]}
                            onCheckedChange={(checked) =>
                              toggleAttendance(trainee.phoneNumber, checked === true)
                            }
                          />
                          Attended
                        </label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Trainees</DialogTitle>
            <DialogDescription>
              Select attendance date, then add trainee details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                Attendance Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={setCreateDateToToday}
                className="h-9 rounded-lg"
              >
                Use Today
              </Button>
            </div>

            <div className="space-y-3">
              {draftRows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">Trainee {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDraftRow(row.id)}
                      disabled={draftRows.length === 1}
                      className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input
                      placeholder="Full name"
                      value={row.name}
                      onChange={(e) => updateDraftRow(row.id, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Phone number"
                      value={row.phoneNumber}
                      onChange={(e) =>
                        updateDraftRow(row.id, "phoneNumber", e.target.value)
                      }
                    />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={row.email}
                      onChange={(e) => updateDraftRow(row.id, "email", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDraftRow}
                  className="h-10 rounded-xl"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Trainee Row
                </Button>

                <Button
                  type="button"
                  onClick={handleCreateTrainees}
                  disabled={isCreating}
                  className="h-10 rounded-xl bg-[#3B82F6] px-5 font-bold text-white hover:bg-blue-600"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Trainees"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
