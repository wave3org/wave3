import { Suspense } from "react";
import { SearchContent } from "./_components/SearchContent";

const SearchPage = () => {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto px-4 py-8">
					<span className="loading loading-spinner"></span>
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
};

export default SearchPage;
