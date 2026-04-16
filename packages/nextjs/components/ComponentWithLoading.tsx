import { ReactNode } from "react";

interface ComponentWithLoadingProps {
	isLoading: boolean;
	children?: ReactNode | undefined;
}

const ComponentWithLoading = ({ ...props }: ComponentWithLoadingProps) => {
	return (
		<>
			{props.isLoading ? (
				<div className="loading-spinner-container">
					<span className="loading loading-spinner"></span>
				</div>
			) : (
				<>{props.children}</>
			)}
		</>
	);
};

export default ComponentWithLoading;
