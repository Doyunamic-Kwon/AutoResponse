import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID || "temp",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "temp",
        }),
        NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID || "temp",
            clientSecret: process.env.NAVER_CLIENT_SECRET || "temp",
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "temp",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "temp",
        }),
        CredentialsProvider({
            name: "Test Account",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "test@example.com" },
            },
            async authorize(credentials) {
                // This is a dummy login for development
                if (credentials?.email === "test@example.com") {
                    let user = await prisma.user.findUnique({
                        where: { email: "test@example.com" }
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: "test@example.com",
                                name: "Test Boss",
                                image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
                            }
                        });
                    }
                    return user;
                }
                return null;
            }
        })
    ],
    session: {
        strategy: "jwt" // Adapter used, but we need JWT for CredentialsProvider easily
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
