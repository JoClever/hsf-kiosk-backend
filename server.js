import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 8080;

// Pfad zu lokalem Nextcloud-Verzeichnis
const baseDir = "/home/josias/Documents/testdocs";

// Statische Dateien (PDFs, Bilder)
app.use("/docs", express.static(baseDir));

// API für Dateiliste
app.get("/api/files", (req, res) => {
	const category = req.query.category;

	// Wenn eine Kategorie angegeben ist, nur die Dateien in diesem Ordner auflisten
	if (category) {
		const dir = path.join(baseDir, category);
		if (!fs.existsSync(dir)) return res.json([]);
		const files = fs.readdirSync(dir).map((name) => ({
			name,
			path: `/docs/${category}/${name}`,
		}));
		return res.json(files);
	}

	// Ohne angegebene Kategorie: Alle Unterordner als Kategorien lesen
	if (!fs.existsSync(baseDir)) return res.json([]);
	const categories = fs.readdirSync(baseDir).filter((file) => {
		return fs.statSync(path.join(baseDir, file)).isDirectory();
	});

	const result = categories.map((cat) => {
		const catDir = path.join(baseDir, cat);
		const files = fs.readdirSync(catDir).map((name) => ({
			name,
			path: `/docs/${cat}/${name}`,
		}));
		return { category: cat, files };
	});

	res.json(result);
});

// Handling GET / request
app.use("/", express.static("public"));

// Server starten
app.listen(PORT, () => {
	console.log(`Backend läuft auf http://localhost:${PORT}`);
});
