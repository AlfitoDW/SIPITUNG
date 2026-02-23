interface AppLogoProps {
    isCollapsed: boolean;
}

export default function AppLogo({ isCollapsed }: AppLogoProps) {
    const logoSrc = isCollapsed ? "/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" : "/Logo-LLDikti-Wilayah-III-08.png"; // Placeholder for expanded logo

    return (
        <div className="flex items-center gap-x-2">
            <img
                src={logoSrc}
                alt="Logo LLDIKTI"
                className={isCollapsed ? "h-6 w-auto transition-all" : "h-8 w-auto transition-all"}
            />
        </div>
    );
}
