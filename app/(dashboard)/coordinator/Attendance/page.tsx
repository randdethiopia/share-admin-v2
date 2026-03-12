"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";

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

const getInitialAttendance = (trainees: AttendanceRow[]) =>
  trainees.reduce<Record<string, boolean>>((acc, trainee) => {
    acc[trainee.phoneNumber] = false;
    return acc;
  }, {});

export default function CoordinatorAttendancePage() {
  const [trainees] = useState<AttendanceRow[]>(MOCK_TRAINEES);
  const [attendanceByPhone, setAttendanceByPhone] = useState<Record<string, boolean>>(
    () => getInitialAttendance(MOCK_TRAINEES)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
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

  const formattedAttendanceDate = useMemo(() => {
    if (!attendanceDate) return "Not set";
    const parsedDate = new Date(`${attendanceDate}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return attendanceDate;
    }

    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsedDate);
  }, [attendanceDate]);

  const canCreate = createDate.trim().length > 0;

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
    if (!attendanceDate.trim()) {
      toast.error("Please set the attendance date before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Mock submit delay to simulate request lifecycle in UI.
      await new Promise((resolve) => setTimeout(resolve, 700));

      console.log("Attendance payload sent:", {
        date: attendanceDate,
        attendance: payload,
      });
      toast.success(
        `Attendance submitted: ${attendedCount}/${trainees.length} marked attended.`
      );
    } catch {
      toast.error("Unable to submit attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateDate("");
  };

  const handleCreateTrainees = async () => {
    if (!createDate.trim()) {
      toast.error("Please select a date before continuing.");
      return;
    }

    const createPayload = {
      date: createDate,
    };

    try {
      setIsCreating(true);

      // Mock save delay to keep UX consistent with async operations.
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (createDate === attendanceDate) {
        toast.success("Attendance date is already active.");
        setCreateOpen(false);
        resetCreateForm();
        return;
      }

      setAttendanceDate(createDate);

      console.log("Create attendance session payload:", createPayload);

      setCreateOpen(false);
      resetCreateForm();
      toast.success("Attendance date saved. You can now mark attendees.");
    } catch {
      toast.error("Unable to save attendance date. Please try again.");
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
              <Plus className="mr-2 h-4 w-4" /> Set Attendance Date
            </Button>

            <Button
              type="button"
              onClick={handleSubmitAttendance}
              disabled={isSubmitting || !attendanceDate.trim()}
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

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Attendance Session Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formattedAttendanceDate}
                  </p>
                </div>
              </div>

              <span className="inline-flex h-7 items-center rounded-full border border-blue-200 bg-white px-3 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                {attendanceDate ? "Session Active" : "Date Required"}
              </span>
            </div>
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
            <DialogTitle>Set Attendance Date</DialogTitle>
            <DialogDescription>
              Choose the attendance date, then mark trainees from the table.
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
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  onClick={handleCreateTrainees}
                  disabled={isCreating || !canCreate}
                  className="h-10 rounded-xl bg-[#3B82F6] px-5 font-bold text-white hover:bg-blue-600"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Date"
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
