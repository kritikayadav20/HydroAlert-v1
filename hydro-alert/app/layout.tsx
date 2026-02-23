import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './components/ThemeProvider'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'HydroAlert - Deep Water Dashboard',
    description: 'Immersive Early Warning System for Water-Borne Diseases',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <body className={`${spaceGrotesk.className} bg-[#040814] text-slate-200 antialiased min-h-screen flex selection:bg-[#00f5ff]/30 selection:text-white overflow-x-hidden relative`}>
                <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>

                    {/* Immersive Ambient Background Elements */}
                    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#040814]">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#00f5ff]/10 mix-blend-screen filter blur-[100px] animate-blob"></div>
                        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#20c997]/5 mix-blend-screen filter blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#0a1930] filter blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
                    </div>

                    <Sidebar />
                    <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 lg:pt-0">
                        <Navbar />
                        <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 max-w-[1400px]">
                            {children}
                        </main>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    )
}
