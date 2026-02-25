import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <div className="min-h-screen flex">
            <Head title="Login" />

            {/* ── Kolom Kiri: Branding ── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #003580 0%, #00235a 60%, #001840 100%)' }}>

                {/* Motif batik dekoratif */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `radial-gradient(circle at 20% 80%, #ffffff 1px, transparent 1px),
                                            radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px),
                                            radial-gradient(circle at 50% 50%, #ffffff 0.5px, transparent 0.5px)`,
                            backgroundSize: '60px 60px, 60px 60px, 30px 30px',
                        }}
                    />

                <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 py-16 text-white">

                    {/* Logo Kemendikbud + LLDIKTI berdampingan */}
                    <div className="flex items-center gap-6 mb-10">
                        {/* <img
                            src="/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
                            alt="Logo Kemendikbudristek"
                            className="h-20 w-20 object-contain drop-shadow-lg"
                        /> */}
                        {/* <div className="w-px h-16 bg-white/30" /> */}
                        <img
                            src="/Logo-LLDikti-Wilayah-III-08.png"
                            alt="Logo LLDIKTI Wilayah III"
                            className="h-20 object-contain drop-shadow-lg"
                        />
                    </div>

                    {/* Nama lembaga */}
                    <div className="text-center mb-10">
                        <p className="text-sm font-medium tracking-widest text-blue-200 uppercase mb-2">
                            Kementerian Pendidikan, Kebudayaan, Riset dan Teknologi
                        </p>
                        <h1 className="text-3xl font-bold leading-tight mb-1">
                            LLDIKTI Wilayah III
                        </h1>
                        <p className="text-blue-200 text-sm">
                            Lembaga Layanan Pendidikan Tinggi
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-16 h-0.5 bg-white/30 mb-10" />

                    {/* Nama sistem */}
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">
                            SIPITUNG
                        </h2>
                        <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
                            Platform pengelolaan dokumen perencanaan, keuangan,
                            dan pertanggungjawaban secara terintegrasi.
                        </p>
                    </div>
                </div>

                {/* Footer kiri */}
                <div className="relative z-10 px-12 pb-8 text-center">
                    <p className="text-blue-300 text-xs">
                        © {new Date().getFullYear()} LLDIKTI Wilayah III · Kementerian Pendidikan, Kebudayaan, Riset dan Teknologi
                    </p>
                </div>
            </div>

            {/* ── Kolom Kanan: Form Login ── */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gray-50 px-8 py-12">

                {/* Header mobile (tampil hanya di layar kecil) */}
                <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
                    <div className="flex items-center gap-4">
                        {/* <img
                            src="/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
                            alt="Logo Kemendikbudristek"
                            className="h-12 w-12 object-contain"
                        /> */}
                        <img
                            src="/Logo-LLDikti-Wilayah-III-08.png"
                            alt="Logo LLDIKTI Wilayah III"
                            className="h-12 object-contain"
                        />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 text-center">
                        SIPITUNG<br />LLDIKTI Wilayah III
                    </p>
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
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="username" className="text-gray-700 font-medium text-sm">
                                                 Username
                                            </Label>
                                            <Input
                                                id="username"
                                                type="username"
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

                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                                                    Kata Sandi
                                                </Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                        tabIndex={5}
                                                    >
                                                        Lupa kata sandi?
                                                    </TextLink>
                                                )}
                                            </div>
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
                                            disabled={processing}
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
