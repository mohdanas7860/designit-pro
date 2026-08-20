'use client';
import dynamic from 'next/dynamic';

const CanvasEditor = dynamic(
    () => import('@/components/Editor/CanvasEditor'),
    { ssr: false }
);

export default function PassportPage() {
    return (
        <main className="min-h-screen z-50">
            <CanvasEditor initialView="passport-studio" />
        </main>
    );
}
