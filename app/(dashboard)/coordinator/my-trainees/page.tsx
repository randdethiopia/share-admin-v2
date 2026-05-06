"use client";

import { useEffect, useMemo, useState } from "react";
import TraineeAuth, { type TraineeType } from "@/api/trainee";
import PaginationControls from "@/components/shared/PaginationControls";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
import { AxiosError } from "axios";
import { Loader2, Search } from "lucide-react";
import { CreateSessionModal } from "./components/create-session";

type TraineeTypeFilter = "all" | "NORMAL" | "EDGE";
type TraineeStatusFilter = "all" | "active" | "inactive";

function normalizeIsActive(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "active";
  }
  return false;
}

function resolveErrorCopy(error: unknown): { message: string; hint?: string } {
  const ax = error as AxiosError<ErrorRes>;
  const status = ax.response?.status;
  const raw = ax.response?.data?.message;

  if (status === 404) {
    return {
      message: raw || "Coordinator not found.",
      hint: "Check that your account is registered as a coordinator.",
    };
  }
  if (status === 403) {
    return {
      message: raw || "You do not have permission to view these trainees.",
    };
  }
  if (status === 400) {
    return {
      message: raw || "Invalid coordinator id.",
    };
  }
  return {
    message: raw || "Failed to load trainees.",
  };
}

export default function CoordinatorMyTraineesPage() {
  const coordinatorId = useAuthStore((s) => s._id);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TraineeTypeFilter>("all");
  const [status, setStatus] = useState<TraineeStatusFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const typeParam = useMemo(() => {
    return type === "all" ? undefined : type;
  }, [type]);

  const statusParam = useMemo(() => {
    if (status === "inactive") return "0";
    return undefined;
  }, [status]);

  const canFetch = hasHydrated && Boolean(coordinatorId);

  const { data, isLoading, isError, error } =
    TraineeAuth.GetCoordinatorTrainees.useQuery(
      coordinatorId ?? "",
      page,
      pageSize,
      typeParam,
      search.trim() || undefined,
      statusParam,
      { enabled: canFetch }
    );

  const trainees = useMemo(() => data?.data ?? [], [data]);
  const totalItems = data?.meta?.totalItems ?? 0;

  const visibleTrainees = useMemo(() => {
    if (status === "active") {
      return trainees.filter((t) => normalizeIsActive(t.isActive));
    }
    if (status === "inactive") {
      return trainees.filter((t) => !normalizeIsActive(t.isActive));
    }
    return trainees;
  }, [trainees, status]);

  const errorCopy = isError ? resolveErrorCopy(error) : null;

  return (
    <>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
          <div className="absolute -left-6 -bottom-10 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
                My Trainees
              </h1>
              <p className="max-w-2xl text-sm font-medium text-slate-600">
                View trainees assigned to you and create session{" "}
                blocks for your upcoming training days.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <CreateSessionModal />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          {!hasHydrated ? (
            <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading session…
            </div>
          ) : !coordinatorId ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
              Unable to resolve your account id. Sign in again and retry.
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search name or phone…"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="w-full sm:w-36">
                    <label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-gray-400">
                      Type
                    </label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        if (v === "all" || v === "NORMAL" || v === "EDGE") {
                          setType(v);
                          setPage(1);
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="EDGE">Edge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-gray-400">
                      Status
                    </label>
                    <Select
                      value={status}
                      onValueChange={(v) => {
                        if (v === "all" || v === "active" || v === "inactive") {
                          setStatus(v);
                          setPage(1);
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-40">
                    <label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-gray-400">
                      Rows per page
                    </label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        const next = Number(v);
                        setPageSize(Number.isFinite(next) && next > 0 ? next : 10);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {isError && errorCopy && (
                <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  <div className="font-semibold">{errorCopy.message}</div>
                  {errorCopy.hint && (
                    <div className="mt-1 text-xs text-red-700">{errorCopy.hint}</div>
                  )}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
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
                      <TableHead className="h-12 px-6 text-center text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-sm text-slate-600">
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Loading trainees…
                        </TableCell>
                      </TableRow>
                    ) : isError ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-sm text-slate-500"
                        >
                          Could not load trainees. See the message above.
                        </TableCell>
                      </TableRow>
                    ) : visibleTrainees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-32 text-center text-sm text-slate-500"
                        >
                          No trainees assigned yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleTrainees.map((trainee: TraineeType) => (
                        <TableRow
                          key={trainee._id}
                          className="border-gray-50 hover:bg-slate-50/50"
                        >
                          <TableCell className="px-6 py-5 font-bold text-gray-700 sm:px-8">
                            {`${trainee.firstname ?? ""} ${trainee.lastname ?? ""}`.trim() ||
                              trainee.username ||
                              "-"}
                          </TableCell>
                          <TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
                            {trainee.phoneNumber || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
                            <span className="block max-w-56 truncate">
                              {trainee.email || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-5 sm:px-8">
                            <div className="flex items-center justify-center">
                              <span
                                className={cn(
                                  "rounded-md px-2 py-1 text-[10px] font-bold uppercase",
                                  normalizeIsActive(trainee.isActive)
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                {normalizeIsActive(trainee.isActive)
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                page={page}
                onPageChange={setPage}
                totalItems={totalItems}
                pageSize={pageSize}
                disabled={isLoading || isError}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
