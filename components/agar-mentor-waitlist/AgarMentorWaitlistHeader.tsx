import { ClipboardList } from "lucide-react";

export function AgarMentorWaitlistHeader() {
	return (
		<div className="flex items-start gap-4">
			<div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
				<ClipboardList className="h-6 w-6" />
			</div>
			<div>
				<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
					AGAR Mentor Waitlist
				</h1>
				<p className="text-zinc-600 text-sm font-medium">
					Review mentor program applications
				</p>
			</div>
		</div>
	);
}
