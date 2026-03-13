"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Loader2, MapPin, Send, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type AssignedSessionData = {
  date?: string;
  sessionId?: string;
  traineeIds?: string[];
  trainees?: AttendanceRow[];
  assignedAt?: string;
};

type CreatedSessionData = {
  id?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  coordinatorId?: string;
  location?: string;
};

const ASSIGNED_SESSION_STORAGE_KEY = "coordinator_assigned_trainees_session";
const CREATED_SESSIONS_STORAGE_KEY = "coordinator_created_sessions";

const getInitialAttendance = (trainees: AttendanceRow[]) =>
  trainees.reduce<Record<string, boolean>>((acc, trainee) => {
    acc[trainee.phoneNumber] = false;
    return acc;
  }, {});

const formatClock = (isoDateTime: string) => {
  if (!isoDateTime) return "--:--";
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) return "--:--";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export default function CoordinatorAttendancePage() {
  const [trainees, setTrainees] = useState<AttendanceRow[]>([]);
  const [attendanceByPhone, setAttendanceByPhone] = useState<Record<string, boolean>>(
    () => getInitialAttendance([])
  );

  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const [selectedAssignedDate, setSelectedAssignedDate] = useState("");
  const [assignedSessionId, setAssignedSessionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scheduledAssignments = useMemo(() => {
    const rawData = localStorage.getItem(ASSIGNED_SESSION_STORAGE_KEY);
    if (!rawData) return [] as AssignedSessionData[];

    try {
      const parsed = JSON.parse(rawData) as AssignedSessionData | AssignedSessionData[];
      const normalized = Array.isArray(parsed) ? parsed : [parsed];
      return normalized.filter((item) => item.date && Array.isArray(item.trainees));
    } catch {
      toast.error("Failed to read scheduled assignments.");
      return [] as AssignedSessionData[];
    }
  }, []);

  const createdSessions = useMemo(() => {
    const rawData = localStorage.getItem(CREATED_SESSIONS_STORAGE_KEY);
    if (!rawData) return [] as CreatedSessionData[];

    try {
      const parsed = JSON.parse(rawData) as CreatedSessionData | CreatedSessionData[];
      const normalized = Array.isArray(parsed) ? parsed : [parsed];
      return normalized.filter((item) => item.id && item.date);
    } catch {
      toast.error("Failed to read created sessions.");
      return [] as CreatedSessionData[];
    }
  }, []);

  const sessionOptions = useMemo(
    () => {
      const assignmentMap = new Map<string, AssignedSessionData>();

      scheduledAssignments
        .filter((item) => item.sessionId && item.date)
        .forEach((item) => {
          assignmentMap.set(`${item.sessionId}::${item.date}`, item);
        });

      const fromCreated = createdSessions
        .filter((item) => item.id && item.date)
        .map((item) => {
          const key = `${item.id}::${item.date}`;
          const matched = assignmentMap.get(key);

          return {
            key,
            sessionId: item.id as string,
            date: item.date as string,
            location: item.location || "-",
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            traineesCount: Array.isArray(matched?.trainees) ? matched!.trainees!.length : 0,
          };
        });

      const hasCreatedKeys = new Set(fromCreated.map((item) => item.key));

      const assignmentOnly = scheduledAssignments
        .filter((item) => item.sessionId && item.date)
        .map((item) => ({
          key: `${item.sessionId}::${item.date}`,
          sessionId: item.sessionId as string,
          date: item.date as string,
          location: "-",
          startTime: "",
          endTime: "",
          traineesCount: Array.isArray(item.trainees) ? item.trainees.length : 0,
        }))
        .filter((item) => !hasCreatedKeys.has(item.key));

      return [...fromCreated, ...assignmentOnly];
    },
    [createdSessions, scheduledAssignments]
  );

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

  const selectedSessionOption = useMemo(
    () => sessionOptions.find((option) => option.key === selectedSessionKey),
    [selectedSessionKey, sessionOptions]
  );

  const formattedAssignedDate = useMemo(() => {
    if (!selectedAssignedDate) return "Not selected";
    const parsedDate = new Date(`${selectedAssignedDate}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return selectedAssignedDate;
    }

    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsedDate);
  }, [selectedAssignedDate]);

  const handleSessionSelect = (selectedKey: string) => {
    setSelectedSessionKey(selectedKey);

    if (!selectedKey) {
      setTrainees([]);
      setAssignedSessionId("");
      setSelectedAssignedDate("");
      setAttendanceByPhone(getInitialAttendance([]));
      return;
    }

    const [sessionId, date] = selectedKey.split("::");
    if (!sessionId || !date) {
      toast.error("Invalid session selection.");
      return;
    }

    const selectedSchedule = scheduledAssignments.find(
      (item) => item.sessionId === sessionId && item.date === date
    );

    if (!selectedSchedule || !Array.isArray(selectedSchedule.trainees)) {
      setTrainees([]);
      setAssignedSessionId("");
      setSelectedAssignedDate("");
      setAttendanceByPhone(getInitialAttendance([]));
      toast.warning("No trainees scheduled for selected session.");
      return;
    }

    setTrainees(selectedSchedule.trainees);
    setAssignedSessionId(selectedSchedule.sessionId || "");
    setSelectedAssignedDate(selectedSchedule.date || "");
    setAttendanceByPhone(getInitialAttendance(selectedSchedule.trainees));
    toast.success("Session trainees loaded.");
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSessionKey) {
      toast.error("Select a session before submitting attendance.");
      return;
    }

    if (!trainees.length) {
      toast.error("No trainees loaded for selected session.");
      return;
    }

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 700));

      console.log("Attendance payload sent:", {
        assignedDate: selectedAssignedDate,
        sessionId: assignedSessionId || undefined,
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

  const toggleAttendance = (phoneNumber: string, checked: boolean) => {
    setAttendanceByPhone((prev) => ({
      ...prev,
      [phoneNumber]: checked,
    }));
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-r from-indigo-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-100/60 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-sky-100/60 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
            Attendance
            </h1>
            <p className="max-w-xl text-sm font-medium text-slate-600">
              Pick a session, verify details, and mark trainee attendance in one clean workflow.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="w-full sm:w-120">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                Session
              </label>
              <select
                value={selectedSessionKey}
                onChange={(e) => handleSessionSelect(e.target.value)}
                className="h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-medium text-slate-700 outline-none ring-blue-300 focus:ring-2"
              >
                <option value="">Select session</option>
                {sessionOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.date} | {option.location} | {option.sessionId} ({option.traineesCount})
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              onClick={handleSubmitAttendance}
              disabled={isSubmitting || !selectedSessionKey}
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            Total Trainees
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{trainees.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Marked Attended
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{attendedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Current Session
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {selectedSessionOption
              ? `${selectedSessionOption.sessionId} at ${selectedSessionOption.location}`
              : "No session selected"}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
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
                  Assigned Date
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formattedAssignedDate}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {assignedSessionId && (
                <span className="inline-flex h-7 items-center rounded-full border border-blue-200 bg-white px-3 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Session: {assignedSessionId}
                </span>
              )}
              {selectedSessionOption?.location && selectedSessionOption.location !== "-" && (
                <span className="inline-flex h-7 items-center gap-1 rounded-full border border-sky-200 bg-white px-3 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedSessionOption.location}
                </span>
              )}
              {selectedSessionOption && (
                <span className="inline-flex h-7 items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatClock(selectedSessionOption.startTime)}-{formatClock(selectedSessionOption.endTime)}
                </span>
              )}
            </div>
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

          {trainees.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm font-medium text-gray-500">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Users className="h-5 w-5" />
              </div>
              No trainees scheduled for this session yet.
            </div>
          )}
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

              {trainees.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm font-medium text-gray-500 sm:px-8"
                  >
                    No trainees scheduled for this session yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
