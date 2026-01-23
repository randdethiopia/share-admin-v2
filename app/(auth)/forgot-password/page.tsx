"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordData } from "@/lib/validator";
import api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = api.AdminAuth.forgotPassword.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Verification code sent to your phone!");
      // We pass the phone number to the next page so the user doesn't type it again
      router.push(`/reset-password?phone=${variables.phoneNumber}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to send code");
    },
  });

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phoneNumber: "" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>Enter your phone to receive a reset code</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => forgotPassword(data))} className="space-y-6">
              <FormField name="phoneNumber" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10 h-12" placeholder="0912345678" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-12 font-bold" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Send Code"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 flex-center gap-2">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}