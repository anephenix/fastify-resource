import { api } from "./api";

export type User = {
	id: number;
	username: string;
	email: string;
};

class SessionStore {
	user = $state<User | null>(null);
	loading = $state(true);

	async load(): Promise<void> {
		this.loading = true;
		try {
			this.user = (await api.get("/profile")) as User;
		} catch {
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async logout(): Promise<void> {
		try {
			await api.post("/logout");
		} catch {
			// already logged out / session expired - fine either way
		}
		this.user = null;
	}
}

export const session = new SessionStore();
