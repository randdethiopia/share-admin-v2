"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ReplyFormProps = {
	ticketId: string;
	onSuccess?: () => void;
	disabled?: boolean;
};

export function ReplyForm({ ticketId, onSuccess, disabled = false }: ReplyFormProps) {
	const [message, setMessage] = useState("");

	const { mutate, isPending } = api.Support.Reply.useMutation({
		onSuccess: () => {
			setMessage("");
			onSuccess?.();
		},
	});

	const handleSubmit = () => {
		const trimmed = message.trim();
		if (!trimmed || isPending || disabled) return;

		mutate({ id: ticketId, message: trimmed });
	};

	return (
		<div className="space-y-3">
			<Textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				placeholder="Type your admin reply..."
				className="min-h-[100px] border-0 bg-[#F4F4F5]"
				disabled={isPending || disabled}
			/>
			<Button
				type="button"
				onClick={handleSubmit}
				disabled={isPending || disabled || !message.trim()}
				className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-agar-orange-dark"
			>
				{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
				Send Reply & Email
			</Button>
		</div>
	);
}
