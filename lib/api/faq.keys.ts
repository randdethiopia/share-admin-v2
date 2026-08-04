export const faqKeys = {
	all: ["faq"] as const,
	list: () => [...faqKeys.all, "list"] as const,
};
