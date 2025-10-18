import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 8080;

// Pfad zu lokalem Nextcloud-Verzeichnis
const baseDir = "/home/josias/Documents/kiosk";

// Statische Dateien (PDFs, Bilder)
app.use("/docs", express.static(baseDir));

// API für Dateiliste
app.get("/api/files", (req, res) => {
	const categoryQuery = req.query.category;
	const templatePath = path.join(baseDir, "template.json");
	if (!fs.existsSync(templatePath)) return res.json([]);

	const templateData = JSON.parse(fs.readFileSync(templatePath, "utf8"));

	// Helper to format date as "DD. Monat YYYY"
	function formatDate(date) {
		const d = new Date(date);
		const day = d.getDate();
		const monthNames = [
			"Januar",
			"Februar",
			"März",
			"April",
			"Mai",
			"Juni",
			"Juli",
			"August",
			"September",
			"Oktober",
			"November",
			"Dezember",
		];
		const monthName = monthNames[d.getMonth()];
		const year = d.getFullYear();
		return `${day}. ${monthName} ${year}`;
	}

	let result;
	if (categoryQuery) {
		// Scan for specified category (either by directory or display_name)
		const entry = templateData.find(
			(item) => item.directory === categoryQuery || item.display_name === categoryQuery
		);
		if (!entry) return res.json([]);
		const catDir = path.join(baseDir, entry.directory);
		if (!fs.existsSync(catDir)) return res.json([]);
		const files = fs.readdirSync(catDir)
			.filter((file) => fs.statSync(path.join(catDir, file)).isFile())
			.map((fileName) => {
				const filePath = path.join(catDir, fileName);
				const stats = fs.statSync(filePath);
				let fileData = {
					file_name: fileName,
					date: formatDate(stats.mtime),
					path: `/docs/${entry.directory}/${fileName}`,
				};
				if (entry.files) {
					const override = entry.files.find((item) => item.file_name === fileName);
					if (override) {
						if (override.display_name) fileData.display_name = override.display_name;
						if (override.date) fileData.date = override.date;
					}
				}
				return fileData;
			});
		result = { display_name: entry.display_name, files };
	} else {
		// Scan all directories from template.json
		result = templateData.map((entry) => {
			const catDir = path.join(baseDir, entry.directory);
			let files = [];
			if (fs.existsSync(catDir)) {
				files = fs.readdirSync(catDir)
					.filter((file) => fs.statSync(path.join(catDir, file)).isFile())
					.map((fileName) => {
						const filePath = path.join(catDir, fileName);
						const stats = fs.statSync(filePath);
						let fileData = {
							file_name: fileName,
							date: formatDate(stats.mtime),
							path: `/docs/${entry.directory}/${fileName}`,
						};
						if (entry.files) {
							const override = entry.files.find((item) => item.file_name === fileName);
							if (override) {
								if (override.display_name) fileData.display_name = override.display_name;
								if (override.date) fileData.date = override.date;
							}
						}
						return fileData;
					});
			}
			return { display_name: entry.display_name, files };
		});
	}

	res.json(result);
});

// Handling GET / request
app.use("/", express.static("public"));

// Server starten
app.listen(PORT, () => {
	console.log(`Backend läuft auf http://localhost:${PORT}`);
});
