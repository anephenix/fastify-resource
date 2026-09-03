import { type Job, Worker } from "@anephenix/job-queue";
import { emailQueue } from "./emailQueue.js";

type EmailJobData = { to: string; subject: string; body: string };

class EmailWorker extends Worker {
	async processJob(job: Job): Promise<void> {
		this.status = "processing";
		try {
			const { to, subject, body } = job.data as EmailJobData;
			console.log(
				`\n--- email ---\nTo: ${to}\nSubject: ${subject}\n\n${body}\n-------------\n`,
			);
			await this.completeJob(job);
		} catch (error) {
			console.error("Error processing email job:", error);
			await this.failJob(job);
		}
	}
}

export const emailWorker = new EmailWorker(emailQueue);
