/*
    This will delete the example.db file
*/

import fs from "node:fs";
import path from "node:path";

const log = false; // Set to true to enable logging

const dbPath = path.join(__dirname, "unit_tests.db");
if (log) {
	console.log("Deleting database file at:", dbPath);
}

// Function to delete the database file
async function deleteDatabase() {
	// Check if the file exists
	if (!fs.existsSync(dbPath)) {
		if (log) {
			console.log("Database file does not exist, nothing to delete.");
		}
		return;
	}
	fs.unlinkSync(dbPath);
}

export { deleteDatabase };
