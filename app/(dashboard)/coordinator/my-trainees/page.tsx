"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateSessionModal } from "./components/create-session";

type TraineeRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
};

const MOCK_TRAINEES: TraineeRow[] = [
  {
    id: "trainee-001",
    name: "Abel Worku",
    phone: "+251-911-220-331",
    email: "abel.worku@share.local",
    status: "ACTIVE",
  },
  {
    id: "trainee-002",
    name: "Meron Hailu",
    phone: "+251-922-110-442",
    email: "meron.hailu@share.local",
    status: "INACTIVE",
  },
  {
    id: "trainee-003",
    name: "Yonas Fikru",
    phone: "+251-933-340-228",
    email: "yonas.fikru@share.local",
    status: "ACTIVE",
  },
  {
    id: "trainee-004",
    name: "Rahel Assefa",
    phone: "+251-944-512-178",
    email: "rahel.assefa@share.local",
    status: "ACTIVE",
  },
];

export default function CoordinatorMyTraineesPage() {
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
                Create professional session blocks for your upcoming training days.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <CreateSessionModal />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
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
                {MOCK_TRAINEES.map((trainee) => (
                  <TableRow
                    key={trainee.id}
                    className="border-gray-50 hover:bg-slate-50/50"
                  >
                    <TableCell className="px-6 py-5 font-bold text-gray-700 sm:px-8">
                      {trainee.name}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
                      {trainee.phone}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
                      <span className="block max-w-56 truncate">{trainee.email}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5 sm:px-8">
                      <div className="flex items-center justify-center">
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                            trainee.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {trainee.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}