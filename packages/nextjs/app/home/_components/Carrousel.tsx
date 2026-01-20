"use client";

import { ReactNode } from "react";

interface CarrouselProps {
	children: ReactNode;
	title: string;
}

const Carrousel = ({ children, ...props }: CarrouselProps) => {
	return (
		<>
			<div className="subtitle">
				<span>{props.title}</span>
			</div>
			<div className="carrousel">{children}</div>
		</>
	);
};

export default Carrousel;
