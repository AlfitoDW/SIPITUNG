import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type TahunAnggaran = {
    id: number;
    tahun: number;
    label: string;
};

type Props = {
    status?: string;
    tahunAnggaranList: TahunAnggaran[];
    defaultTahunAnggaranId: number | null;
};

export default function Login({ status, tahunAnggaranList, defaultTahunAnggaranId }: Props) {
    const [selectedTahun, setSelectedTahun] = useState<string>(
        defaultTahunAnggaranId ? String(defaultTahunAnggaranId) : ''
    );

    return (
        <div className="min-h-screen flex">
            <Head title="Login" />

            {/* ── Kolom Kiri: Branding ── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden">

                {/* Background foto gedung */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url(/Gedung-Crop2.png)' }}
                />

                {/* Overlay gradient gelap supaya teks terbaca */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, rgba(0,30,80,0.55) 0%, rgba(0,15,50,0.80) 60%, rgba(0,10,35,0.95) 100%)' }}
                />

                {/* Shimmer line dekoratif */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #4fa3ff, transparent)' }} />

                <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 py-16 text-white">

                    {/* Logo LLDIKTI (Vector SVG Resmi) */}
                    <div className="flex items-center justify-center mb-10">
                        <img
                            src="/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
                            alt="Logo Kemendikbudristek"
                            className="h-24 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        />
                    </div>

                    {/* Nama lembaga */}
                    <div className="text-center mb-14">
                        <p className="text-xs font-semibold tracking-[0.2em] text-blue-200 uppercase mb-3">
                            Kementerian Pendidikan, Tinggi, Sains, dan Teknologi
                        </p>
                        <h1 className="text-3xl font-extrabold leading-tight mb-1 drop-shadow-md">
                            LLDIKTI Wilayah III
                        </h1>
                        <p className="text-blue-200 text-sm mt-1">
                            Lembaga Layanan Pendidikan Tinggi
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-14 w-56">
                        <div className="flex-1 h-px bg-white/30" />
                        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        <div className="flex-1 h-px bg-white/30" />
                    </div>

                    {/* Nama sistem */}
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                            <h2 className="text-lg font-bold tracking-widest uppercase leading-none">
                                SIPITUNG
                            </h2>
                        </div>
                        <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
                            Platform pengelolaan dokumen perencanaan, keuangan,
                            dan pertanggungjawaban secara terintegrasi.
                        </p>
                    </div>
                </div>

                {/* Footer kiri */}
                <div className="relative z-10 px-12 pb-8 text-center">
                    <p className="text-blue-300/70 text-xs">
                        © {new Date().getFullYear()} LLDIKTI Wilayah III · Kementerian Pendidikan, Tinggi, Sains, dan Teknologi
                    </p>
                </div>
            </div>

            {/* ── Kolom Kanan: Form Login ── */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gray-50 px-8 py-12">

                {/* Header mobile */}
                <div className="lg:hidden flex flex-col items-center gap-3 mb-8 text-center mt-2">
                    <img
                        src="/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
                        alt="Logo Kemendikbudristek"
                        className="h-16 w-auto drop-shadow-sm mb-1"
                    />
                    <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">
                            Kementerian Pendidikan Tinggi, Sains, & Teknologi
                        </p>
                        <p className="text-lg font-extrabold text-gray-800 leading-tight">
                            SIPITUNG
                        </p>
                        <p className="text-xs font-medium text-gray-600">
                            LLDIKTI Wilayah III
                        </p>
                    </div>
                </div>

                <div className="w-full max-w-md">
                    {/* Card form */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10">

                        {/* Judul form */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-5 w-1 rounded-full bg-red-600" />
                                <h2 className="text-xl font-bold text-gray-800">
                                    Masuk ke Sistem
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500 ml-3">
                                Masukkan kredensial akun Anda untuk melanjutkan
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                                {status}
                            </div>
                        )}

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-5">

                                        {/* Tahun Anggaran */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-gray-700 font-medium text-sm">
                                                Tahun Anggaran
                                            </Label>
                                            <input type="hidden" name="tahun_anggaran_id" value={selectedTahun} />
                                            <Select value={selectedTahun} onValueChange={setSelectedTahun}>
                                                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                                    <SelectValue placeholder="Pilih tahun anggaran" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tahunAnggaranList.map((ta) => (
                                                        <SelectItem key={ta.id} value={String(ta.id)}>
                                                            {ta.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Username */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="username" className="text-gray-700 font-medium text-sm">
                                                Username
                                            </Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                name="username"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="Masukkan username Anda"
                                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <InputError message={errors.username} />
                                        </div>

                                        {/* Kata Sandi */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                                                Kata Sandi
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* Remember me */}
                                        <div className="flex items-center gap-2.5">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                                className="border-gray-300"
                                            />
                                            <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                                Ingat saya di perangkat ini
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            tabIndex={4}
                                            disabled={processing || (tahunAnggaranList.length > 0 && !selectedTahun)}
                                            data-test="login-button"
                                            className="h-11 w-full font-semibold mt-1"
                                            style={{ backgroundColor: '#003580' }}
                                        >
                                            {processing && <Spinner />}
                                            Masuk
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>

                    {/* Footer kanan */}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        Sistem ini hanya untuk pengguna yang berwenang.
                        <br />
                        Hubungi administrator jika mengalami masalah akses.
                    </p>
                </div>
            </div>
        </div>
    );
}
