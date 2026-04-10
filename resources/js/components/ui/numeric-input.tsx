import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * NumericInput — input angka dengan format Indonesia (koma sebagai desimal)
 *
 * - User mengetik: 90,1  → value yang dikirim ke onChange: "90.1"
 * - Titik (.) diblokir; hanya koma (,) yang diizinkan sebagai desimal
 * - Mendukung angka negatif dan bilangan bulat
 * - value prop dapat berupa string dengan titik ("90.1") → tampil sebagai "90,1"
 */

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
    /** Nilai saat ini — bisa berformat titik ("90.1") atau koma ("90,1") */
    value?: string | number
    /**
     * Dipanggil saat nilai berubah.
     * @param dotValue  — nilai dengan titik sebagai desimal, siap dikirim ke backend (misal "90.1")
     * @param commaValue — nilai dengan koma sebagai desimal, untuk ditampilkan (misal "90,1")
     */
    onChange?: (dotValue: string, commaValue: string) => void
}

/** Konversi nilai dari format titik ke format koma (untuk tampilan) */
export function toDotFormat(v: string): string {
    return v.replace(",", ".")
}

/** Konversi nilai dari format koma ke format titik (untuk backend) */
export function toCommaDisplay(v: string | number | undefined): string {
    if (v === undefined || v === null || v === "") return ""
    return String(v).replace(".", ",")
}

function NumericInput({
    className,
    value,
    onChange,
    onKeyDown,
    ...props
}: NumericInputProps) {
    // Tampilkan nilai dengan koma
    const displayValue = toCommaDisplay(value)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!onChange) return
        const raw = e.target.value

        // Tolak jika ada karakter yang bukan angka, koma, atau minus
        // Izinkan: digit, koma (sekali), minus di awal
        const sanitized = raw
            .replace(/\./g, "")          // buang semua titik
            .replace(/,/g, (m, offset, str) => {
                // hanya izinkan koma PERTAMA
                const firstComma = str.indexOf(",")
                return offset === firstComma ? m : ""
            })
            .replace(/[^0-9,\-]/g, "")   // buang karakter selain angka, koma, minus
            .replace(/(?!^)-/g, "")      // buang minus yang bukan di posisi pertama

        const dotValue = sanitized.replace(",", ".")
        onChange(dotValue, sanitized)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        // Blokir titik (.) dari keyboard baik periode maupun numpad
        if (e.key === "." || e.key === "Decimal") {
            e.preventDefault()
        }
        onKeyDown?.(e)
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const pasted = e.clipboardData.getData("text")
        // Cek jika ada titik di paste, konversi ke koma dulu
        if (/\./.test(pasted)) {
            e.preventDefault()
            const converted = pasted.replace(".", ",")
            // Simulasikan input dengan nilai yang sudah dikonversi
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, "value"
            )?.set
            const inputEl = e.currentTarget
            nativeInputValueSetter?.call(inputEl, converted)
            inputEl.dispatchEvent(new Event("input", { bubbles: true }))
        }
    }

    return (
        <input
            type="text"
            inputMode="decimal"
            data-slot="input"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={cn(
                "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className
            )}
            {...props}
        />
    )
}

export { NumericInput }
