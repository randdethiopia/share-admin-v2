import { ScrollText } from "lucide-react";

import {
	describeUserAgent,
	formatEnumLabel,
	formatTimestamp,
	LOG_COLUMNS,
} from "./login-logs.constants";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getLoginLogDisplayName, type LoginLogType } from "@/lib/api/login-log";
import { cn } from "@/lib/utils";

type LoginLogTableProps = {
	logs: LoginLogType[];
	loading: boolean;
	/** Refetching with previous rows still shown (page or filter change). */
	refreshing?: boolean;
	hasFilters: boolean;
};

function TableSkeleton() {
	return (
		<>
			{Array.from({ length: 6 }).map((_, index) => (
				<TableRow key={index}>
					{LOG_COLUMNS.map((column) => (
						<TableCell key={column}>
							<Skeleton className="h-5 w-full max-w-32" />
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
	return (
		<TableRow className="hover:bg-transparent">
			<TableCell colSpan={LOG_COLUMNS.length}>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<ScrollText />
						</EmptyMedia>
						<EmptyTitle>No logs found</EmptyTitle>
						<EmptyDescription>
							{hasFilters
								? "No sign-in attempts match these filters."
								: "Sign-in attempts will appear here."}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</TableCell>
		</TableRow>
	);
}

function LogRow({ log }: { log: LoginLogType }) {
	const secondary = log.userId?.email ?? log.userId?.phoneNumber ?? log.identifier;
	const name = getLoginLogDisplayName(log);

	return (
		<TableRow>
			<TableCell>
				<div className="font-medium text-foreground">{name}</div>
				{secondary && secondary !== name ? (
					<div className="text-xs text-muted-foreground">{secondary}</div>
				) : null}
				{!log.userId ? (
					<div className="text-xs text-muted-foreground">Unknown user</div>
				) : null}
			</TableCell>
			<TableCell>
				<Badge variant="secondary">{formatEnumLabel(log.userType)}</Badge>
			</TableCell>
			<TableCell>
				<Badge variant={log.success ? "success" : "destructive"}>
					{log.success ? "Success" : "Failed"}
				</Badge>
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{log.reason ? formatEnumLabel(log.reason) : "—"}
			</TableCell>
			<TableCell className="font-mono text-xs">{log.ip ?? "—"}</TableCell>
			<TableCell className="max-w-48 truncate text-sm" title={log.userAgent}>
				{describeUserAgent(log.userAgent)}
			</TableCell>
			<TableCell className="whitespace-nowrap text-sm">
				{formatTimestamp(log.timestamp)}
			</TableCell>
		</TableRow>
	);
}

export function LoginLogTable({ logs, loading, refreshing, hasFilters }: LoginLogTableProps) {
	return (
		<div className={cn("transition-opacity", refreshing && "opacity-60")}>
			<Table>
				<TableHeader>
					<TableRow>
						{LOG_COLUMNS.map((column) => (
							<TableHead key={column}>{column}</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						<TableSkeleton />
					) : logs.length === 0 ? (
						<EmptyState hasFilters={hasFilters} />
					) : (
						logs.map((log) => <LogRow key={log._id} log={log} />)
					)}
				</TableBody>
			</Table>
		</div>
	);
}
