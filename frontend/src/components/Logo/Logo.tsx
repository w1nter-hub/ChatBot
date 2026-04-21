import React, { HTMLAttributes } from 'react';
interface IconProps extends HTMLAttributes<HTMLDivElement> {
	width?: number;
	height?: number;
}
export const Logo = ({  height = 28, width, ...restProps }: IconProps) => {
	const iconSize = height;
	const textSize = width ? width / 6 : Math.max(18, Math.round(iconSize * 0.75));
	return (
		<div
			{...restProps}
			style={{ display: "flex", alignItems: "center", gap: "10px", ...(restProps.style || {}) }}
		>
			<svg
				width={iconSize}
				height={iconSize}
				viewBox="0 0 64 64"
				aria-hidden="true"
			>
				<defs>
					<linearGradient id="qoldau-logo-gradient" x1="10%" y1="10%" x2="90%" y2="90%">
						<stop offset="0%" stopColor="#7F58FF" />
						<stop offset="100%" stopColor="#35C2A1" />
					</linearGradient>
				</defs>
				<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#qoldau-logo-gradient)" />
				<path
					d="M25 24c0-4.4 3.6-8 8-8h6v6h-5c-2.2 0-4 1.8-4 4v4c0 2.2 1.8 4 4 4h5v6h-6c-4.4 0-8-3.6-8-8v-8Z"
					fill="#FFFFFF"
				/>
				<path
					d="M40 34l6 6"
					stroke="#FFFFFF"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</svg>
			<span
				style={{
					fontWeight: 700,
					fontSize: textSize,
					lineHeight: 1,
					background: "linear-gradient(135deg, #5a3ac7 0%, #2da889 100%)",
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					backgroundClip: "text",
				}}
			>
				QoldauAI
			</span>
		</div>
	);
};
