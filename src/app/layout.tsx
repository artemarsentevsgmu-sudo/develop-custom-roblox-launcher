import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/700.css";
import "@fontsource/golos-text/800.css";
import "@fontsource/unbounded/400.css";
import "@fontsource/unbounded/500.css";
import "@fontsource/unbounded/600.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/unbounded/900.css";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { FxProvider } from "@/components/fx";
import { AuthProvider } from "@/components/auth";
import { LauncherProvider } from "@/components/launcher";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "RoLaunch — лаунчер Roblox нового поколения",
  description:
    "Красивый и быстрый клиент-витрина Roblox: чарты, каталог, профили, серверы и запуск игр в один клик.",
  applicationName: "RoLaunch",
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="noise min-h-screen antialiased">
        <StoreProvider>
          <FxProvider>
            <AuthProvider>
              <LauncherProvider>
                <Shell>{children}</Shell>
              </LauncherProvider>
            </AuthProvider>
          </FxProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
