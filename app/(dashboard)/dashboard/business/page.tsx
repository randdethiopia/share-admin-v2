"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import SmeProfileApi, { type SMEProfileType } from "@/api/Buisness";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { CheckCheck, Eye, X } from "lucide-react";

type SmeStatus = "PENDING" | "DRAFT" | "APPROVED" | "REJECTED";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getPaginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([1, totalPages]);
  pages.add(currentPage);
  pages.add(currentPage - 1);
  pages.add(currentPage + 1);

  const normalized = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | "..."> = [];
  for (let i = 0; i < normalized.length; i++) {
    const page = normalized[i];
    const prev = normalized[i - 1];
    if (i > 0 && prev !== undefined && page - prev > 1) result.push("...");
    result.push(page);
  }

  return result;
}

function StatusBadge({ status, updateStatus }: { status: string; updateStatus?: SMEProfileType["updateStatus"] }) {
  if (status === "APPROVED") {
    if (updateStatus === "PENDING") {
      return (
        <Badge variant="secondary" className="w-fit border-transparent bg-amber-100 text-amber-800">
          Requesting Update
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="w-fit border-transparent bg-emerald-100 text-emerald-800">
        Approved
      </Badge>
    );
  }

  if (status === "REJECTED") {
    return (
      <Badge variant="destructive" className="w-fit">
        Rejected
      </Badge>
    );
  }

  if (status === "DRAFT") {
    return (
      <Badge variant="outline" className="w-fit">
        Draft
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="w-fit border-transparent bg-amber-100 text-amber-800">
      Pending
    </Badge>
  );
}

function ConfirmAlertDialog(props: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmText: string;
  cancelText: string;
  confirmVariant?: "default" | "destructive";
  pending?: boolean;
  onConfirm: () => void;
}) {
  const {
    title,
    description,
    open,
    onOpenChange,
    confirmText,
    cancelText,
    confirmVariant = "default",
    pending,
    onConfirm,
  } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(buttonVariants({ variant: confirmVariant }))}
            onClick={onConfirm}
          >
            {pending ? "Please wait…" : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Page() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<SmeStatus | "">("");

  const [openApprove, setOpenApprove] = React.useState(false);
  const [openReject, setOpenReject] = React.useState(false);
  const [openUpdateApprove, setOpenUpdateApprove] = React.useState(false);
  const [openUpdateReject, setOpenUpdateReject] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState("");

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const { data, isLoading } = SmeProfileApi.GetList.useQuery();
  const rows = React.useMemo(() => (data ?? []) as SMEProfileType[], [data]);

  const acceptMutation = SmeProfileApi.Approve.useMutation();
  const rejectMutation = SmeProfileApi.Reject.useMutation();
  const updateApproveMutation = SmeProfileApi.UpdateApprove.useMutation();
  const updateRejectMutation = SmeProfileApi.UpdateReject.useMutation();

  const filteredData = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (q && !row.businessName?.toLowerCase().includes(q)) return false;
      if (status && row.status !== status) return false;
      return true;
    });
  }, [rows, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const pagination = React.useMemo(() => getPaginationPages(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <>
      <ConfirmAlertDialog
        title="Approve Business"
        description="Approve this SME business profile? This action cannot be undone."
        open={openApprove}
        onOpenChange={setOpenApprove}
        confirmText="Approve"
        cancelText="Cancel"
        pending={acceptMutation.isPending}
        onConfirm={() => {
          setOpenApprove(false);
          if (!selectedId) return toast.error("Something went wrong");
          acceptMutation.mutate(selectedId);
        }}
      />

      <ConfirmAlertDialog
        title="Reject Business"
        description="Reject this SME business profile? This action cannot be undone."
        open={openReject}
        onOpenChange={setOpenReject}
        confirmText="Reject"
        cancelText="Cancel"
        confirmVariant="destructive"
        pending={rejectMutation.isPending}
        onConfirm={() => {
          setOpenReject(false);
          if (!selectedId) return toast.error("Something went wrong");
          rejectMutation.mutate(selectedId);
        }}
      />

      <ConfirmAlertDialog
        title="Approve Profile Update"
        description="Approve this pending SME profile update? This action cannot be undone."
        open={openUpdateApprove}
        onOpenChange={setOpenUpdateApprove}
        confirmText="Approve"
        cancelText="Cancel"
        pending={updateApproveMutation.isPending}
        onConfirm={() => {
          setOpenUpdateApprove(false);
          if (!selectedId) return toast.error("Something went wrong");
          updateApproveMutation.mutate(selectedId);
        }}
      />

      <ConfirmAlertDialog
        title="Reject Profile Update"
        description="Reject this pending SME profile update? This action cannot be undone."
        open={openUpdateReject}
        onOpenChange={setOpenUpdateReject}
        confirmText="Reject"
        cancelText="Cancel"
        confirmVariant="destructive"
        pending={updateRejectMutation.isPending}
        onConfirm={() => {
          setOpenUpdateReject(false);
          if (!selectedId) return toast.error("Something went wrong");
          updateRejectMutation.mutate(selectedId);
        }}
      />

      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SME Businesses</h1>
          <p className="text-sm text-muted-foreground">Review, approve, and manage SME business profiles.</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Businesses</CardTitle>
            <CardDescription>Search and filter SMEs, then take actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full max-w-sm">
                <Input
                  placeholder="Search by business name"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <span className="shrink-0 text-sm text-muted-foreground">Status</span>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as SmeStatus | "");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-45">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="w-18">View</TableHead>
                    <TableHead className="w-30">Approval</TableHead>
                    <TableHead className="w-35">Profile Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={`sme-skeleton-${index}`}>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell className="hidden py-4 md:table-cell">
                          <Skeleton className="h-6 w-28 rounded-full" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-9 w-24 rounded-md" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-9 w-32 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No SMEs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((sme) => (
                      <TableRow key={sme._id}>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{sme.name}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{sme.businessName}</span>
                            {sme.approvedAt ? (
                              <span className="text-sm text-muted-foreground">Approved at: {formatDate(sme.approvedAt)}</span>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="hidden py-4 md:table-cell">
                          <StatusBadge status={sme.status} updateStatus={sme.updateStatus} />
                        </TableCell>

                        <TableCell className="py-4">
                          <Button asChild variant="ghost" size="icon" className="rounded-lg bg-muted hover:bg-muted/80">
                            <Link href={`/dashboard/business/${sme._id}`} aria-label="View business profile">
                              <Eye className="h-5 w-5" />
                            </Link>
                          </Button>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            {sme.status === "PENDING" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg bg-muted hover:bg-muted/80"
                                onClick={() => {
                                  setSelectedId(sme._id);
                                  setOpenApprove(true);
                                }}
                                aria-label="Approve"
                                disabled={acceptMutation.isPending}
                              >
                                <CheckCheck className="h-5 w-5" />
                              </Button>
                            ) : null}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-lg bg-muted hover:bg-muted/80"
                              onClick={() => {
                                setSelectedId(sme._id);
                                setOpenReject(true);
                              }}
                              aria-label="Reject"
                              disabled={rejectMutation.isPending}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            {sme.updateStatus === "PENDING" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  className="rounded-lg"
                                  onClick={() => {
                                    setSelectedId(sme._id);
                                    setOpenUpdateApprove(true);
                                  }}
                                  aria-label="Approve profile update"
                                  disabled={updateApproveMutation.isPending}
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  className="rounded-lg"
                                  onClick={() => {
                                    setSelectedId(sme._id);
                                    setOpenUpdateReject(true);
                                  }}
                                  aria-label="Reject profile update"
                                  disabled={updateRejectMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-muted-foreground">Items per page</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {filteredData.length === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">{filteredData.length.toLocaleString()}</span> results
                </span>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>

                  {pagination.map((page, index) => (
                    <PaginationItem key={`${page}-${index}`}>
                      {page === "..." ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)}>
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
