"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function SignIn() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] glass p-8 animate-in fade-in zoom-in-95 duration-700">
                <CardHeader className="text-center pb-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                            <Zap className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-black font-outfit tracking-tighter mb-2">Welcome Back</CardTitle>
                    <CardDescription className="text-lg font-medium text-muted-foreground">
                        Sign in to manage your store's reputation with AI.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={() => signIn("credentials", { email: "test@example.com", callbackUrl: "/" })}
                        variant="secondary"
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-primary transition-all hover:-translate-y-1 bg-primary/10 hover:bg-primary/20 border-none"
                    >
                        Enter as Test Boss
                    </Button>
                    <Button
                        onClick={() => signIn("kakao", { callbackUrl: "/" })}
                        className="w-full h-14 rounded-2xl bg-[#FEE500] hover:bg-[#FEE500]/90 text-zinc-900 font-bold border-none transition-all hover:-translate-y-1"
                    >
                        Continue with Kakao
                    </Button>
                    <Button
                        onClick={() => signIn("naver", { callbackUrl: "/" })}
                        className="w-full h-14 rounded-2xl bg-[#03C75A] hover:bg-[#03C75A]/90 text-white font-bold border-none transition-all hover:-translate-y-1"
                    >
                        Continue with Naver
                    </Button>
                    <Button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        variant="outline"
                        className="w-full h-14 rounded-2xl font-bold border-muted-foreground/20 transition-all hover:-translate-y-1"
                    >
                        Continue with Google
                    </Button>

                    <div className="pt-8 text-center">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                            By continuing, you agree to our terms of service.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
