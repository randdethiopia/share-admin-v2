import { Exo_2, Orbitron } from "next/font/google";

const orbitron = Orbitron({
	subsets: ["latin"],
	variable: "--font-orbitron",
});

const exo2 = Exo_2({
	subsets: ["latin"],
	variable: "--font-exo2",
});

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className={`dashboard-analytics ${orbitron.variable} ${exo2.variable}`}>
			{children}
		</div>
	);
}
