"use client";

import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";

interface ProgressBarProps {
	total: number;
	progress: number;
}

const ProgressBar = ({ ...props }: ProgressBarProps) => {
	return (
		<>
			<div className="w-full bg-base-300 rounded-full h-2">
				<div
					className="bg-primary h-2 rounded-full"
					style={{
						width: `${(props.progress / props.total) * 100}%`
					}}
				/>
			</div>
		</>
	);
};

export default ProgressBar;
