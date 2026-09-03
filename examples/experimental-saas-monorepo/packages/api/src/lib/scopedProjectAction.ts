import type { Model, ModelClass } from "objection";
import { modelAction } from "@anephenix/fastify-resource";

/*
  fastify-resource's default modelAction scopes `getAll`/`get`/`create`
  correctly once `user_id` is merged into params (via headerParams, see
  index.ts) - `.where(params)` naturally includes it. It does NOT scope
  `update`/`delete` (patchAndFetchById/deleteById only filter by `id`),
  which would let one user patch/delete another user's project by guessing
  an id. This handles just those two actions and falls through to the
  library's own modelAction for everything else.
*/
export async function scopedProjectAction(
	action: string,
	model: ModelClass<Model>,
	params: Record<string, unknown>,
) {
	if (action === "update") {
		const { id, user_id, ...rest } = params;
		const patchedCount = await model.query().where({ id, user_id }).patch(rest);
		if (patchedCount === 0) {
			throw new Error(`Record with id ${id} not found`);
		}
		return await model.query().where({ id, user_id }).first();
	}
	if (action === "delete") {
		const { id, user_id } = params;
		const deletedCount = await model.query().where({ id, user_id }).delete();
		if (deletedCount === 0) {
			throw new Error(`Record with id ${id} not found`);
		}
		return id;
	}
	return await modelAction(action, model, params);
}
