import app from "../index.ts";

app.listen({ port: 3000 }, (err) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});
