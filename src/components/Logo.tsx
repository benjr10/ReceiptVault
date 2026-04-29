"use client";

import Link from "next/link";

export default function Logo({ size = 48 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <img
        src="/icons/logo.svg"
        alt="ReceiptVault Logo"
        width={size}
        height={size}
        className="rounded-lg"
      />
    </Link>
  );
}
