const qoldauLauncherSvg = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 38px; height: 38px;" aria-hidden="true">
    <defs>
        <linearGradient id="qoldauLauncherGradient" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stop-color="#7F58FF"></stop>
            <stop offset="100%" stop-color="#35C2A1"></stop>
        </linearGradient>
    </defs>
    <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#qoldauLauncherGradient)"></rect>
    <path d="M25 24c0-4.4 3.6-8 8-8h6v6h-5c-2.2 0-4 1.8-4 4v4c0 2.2 1.8 4 4 4h5v6h-6c-4.4 0-8-3.6-8-8v-8Z" fill="#FFFFFF"></path>
    <path d="M40 34l6 6" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"></path>
</svg>`

export const LauncherIconsSVGs: Map<string, string> = new Map([
    ['icon1', qoldauLauncherSvg],
    ['icon2', qoldauLauncherSvg],
    ['icon3', qoldauLauncherSvg],
    ['icon4', qoldauLauncherSvg],
    ['icon5', qoldauLauncherSvg],
]);