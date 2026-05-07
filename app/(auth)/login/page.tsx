"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock, Mail } from "lucide-react"
import { loginSchema, type LoginData } from "@/lib/validator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import api from "@/lib/api"
import { AuthIntro } from "../components/auth-intro"

export default function LoginPage() {

  const router = useRouter()

  const { mutate: login, isPending } = api.AdminAuth.loginAdmin.useMutation({
    onSuccess: () => {
      router.push("/dashboard")
    },
  })

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phoneNumber: "", password: "" },
  })

  const onSubmit = (data: LoginData) => {
    login(data, {
      onSuccess: () => {
        router.push("/dashboard")
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AuthIntro />
      <section className="bg-white px-6 py-10 md:w-1/2 md:px-8 md:py-0">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 md:h-screen md:max-w-2xl md:mx-auto">
          <div>
            <p className="text-2xl text-center font-bold text-black sm:text-3xl">
              Sign in to your account
            </p>

            <p className="text-gray-500 text-center font-medium mt-2">
              Enter your email and password below to access your account.
            </p>
          </div>
          <div>
          </div>
          <div className="w-full flex flex-col items-center justify-center sm:w-4/5 md:w-2/3">
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-xl mt-6">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel className="text-gray-600">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          className="border-none bg-blue-50 focus:ring-0 focus:outline-none focus:border-blue-500"
                          placeholder="Enter your phone number"
                          {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-600">Password</FormLabel>
                      <FormControl>
                        <Input
                          className="border-none bg-blue-50 focus:ring-0 focus:outline-none focus:border-blue-500"
                          type="password"
                          placeholder="Enter you password"
                          {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* forgot password link */}
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button disabled={isPending} type="submit" className="w-full mt-4 bg-blue-400 hover:bg-blue-500 ">
                  {isPending ? <Loader2 className="animate-spin" /> : "Login"}
                </Button>
              </Form>
            </form>
          </div>

        </div>
      </section>

    </div>
  )
}
