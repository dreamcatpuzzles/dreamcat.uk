"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiVoid, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import InlineLink from "@/app/InlineLink";
import { socket } from "@/app/socket";

export default function LogoutPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const logOut = useMutation({
        mutationFn: () =>
            apiVoid("/api/session", { method: "DELETE" }, "Could not log out"),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: queryKeys.session });
            queryClient.removeQueries({ queryKey: queryKeys.game.all });
            socket.disconnect().connect();
            router.replace("/");
        },
    });

    return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
            <InlineLink href="/" size="2xl">
                ← back
            </InlineLink>
            <h1 className="text-3xl text-center py-4">Are you sure?</h1>
            <Button
                onClick={() => logOut.mutate()}
                disabled={logOut.isPending}
            >
                {logOut.isPending ? "logging out…" : "log out"}
            </Button>
            {logOut.error && (
                <p className="pt-4 text-red-700">{logOut.error.message}</p>
            )}
        </div>
    );
}
