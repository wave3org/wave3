"use client";

type SongSearchInputProps = {
	value: string;
	onChange: (value: string) => void;
	onKeyDown?: (key: string) => void;
	placeholder?: string;
	className?: string;
};

export function SongSearchInput({
	value,
	onChange,
	onKeyDown,
	placeholder = "Search songs by name...",
	className = ""
}: SongSearchInputProps) {
	const handleOnKeyDown = (key: string) => {
		if (onKeyDown) {
			onKeyDown(key);
		}
	};

	return (
		<div className={className}>
			<div className="relative">
				<input
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={e => onChange(e.target.value)}
					onKeyDown={e => handleOnKeyDown(e.key)}
					className="input input-bordered w-full pr-10"
				/>
				<span className="absolute right-0 top-0 flex h-full items-center px-3 text-base-content/50">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</span>
			</div>
		</div>
	);
}
