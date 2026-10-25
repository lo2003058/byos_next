import { deleteDeviceAdmin } from "./admin-devices";

const calls: string[] = [];
let friendlyId: string | undefined = "YY5T51";
let failOn: string | null = null;

function makeTrx() {
	return {
		selectFrom: (table: string) => ({
			select: () => ({
				where: () => ({
					executeTakeFirst: async () => {
						calls.push(`select ${table}`);
						return friendlyId ? { friendly_id: friendlyId } : undefined;
					},
				}),
			}),
		}),
		deleteFrom: (table: string) => ({
			where: (column: string, _op: string, value: unknown) => ({
				execute: async () => {
					calls.push(`delete ${table} ${column}=${String(value)}`);
					if (failOn === table) throw new Error(`fk violation on ${table}`);
				},
			}),
		}),
	};
}

jest.mock("@/lib/auth/get-user", () => ({
	requireAdmin: jest.fn(async () => ({ id: "admin", role: "admin" })),
}));
jest.mock("@/lib/database/utils", () => ({
	checkDbConnection: jest.fn(async () => ({ ready: true })),
}));
jest.mock("@/lib/database/db", () => ({
	db: {
		transaction: () => ({
			execute: async (callback: (trx: unknown) => Promise<void>) =>
				callback(makeTrx()),
		}),
	},
}));

beforeEach(() => {
	calls.length = 0;
	friendlyId = "YY5T51";
	failOn = null;
});

describe("deleteDeviceAdmin", () => {
	test("deletes the device's logs before the device so the foreign key holds", async () => {
		const result = await deleteDeviceAdmin(3);

		expect(result).toEqual({ success: true });
		expect(calls).toEqual([
			"select devices",
			"delete logs friendly_id=YY5T51",
			"delete devices id=3",
		]);
	});

	test("succeeds without deleting anything for a device that is already gone", async () => {
		friendlyId = undefined;

		const result = await deleteDeviceAdmin(99);

		expect(result).toEqual({ success: true });
		expect(calls).toEqual(["select devices"]);
	});

	test("reports a failure from the delete", async () => {
		failOn = "devices";

		const result = await deleteDeviceAdmin(3);

		expect(result.success).toBe(false);
		expect(result.error).toMatch(/fk violation on devices/);
	});
});
