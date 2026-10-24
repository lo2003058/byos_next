/// <reference types="jest" />

jest.mock("next/server", () => {
	const actual = jest.requireActual("next/server");
	return {
		...actual,
		connection: jest.fn(async () => undefined),
	};
});

jest.mock("@/lib/database/db", () => ({
	db: {},
}));

jest.mock("@/lib/database/scoped-db", () => ({
	withDeviceApiKey: jest.fn(),
	withExplicitUserScope: jest.fn(),
}));

const checkDbConnection = jest.fn();
jest.mock("@/lib/database/utils", () => ({
	checkDbConnection: (...args: unknown[]) => checkDbConnection(...args),
}));

jest.mock("@/lib/auth/get-user", () => ({
	getCurrentUserId: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
	logError: jest.fn(),
	logInfo: jest.fn(),
	logWarn: jest.fn(),
}));

import { getCurrentUserId } from "@/lib/auth/get-user";
import {
	withDeviceApiKey,
	withExplicitUserScope,
} from "@/lib/database/scoped-db";
import { GET } from "./route";

const mockGetCurrentUserId = getCurrentUserId as jest.Mock;
const mockWithDeviceApiKey = withDeviceApiKey as jest.Mock;
const mockWithExplicitUserScope = withExplicitUserScope as jest.Mock;

function setupRequest(headers: Record<string, string>): Request {
	return new Request("http://localhost/api/setup", { headers });
}

describe("GET /api/setup", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns HTTP 500 when an unexpected setup error is caught", async () => {
		checkDbConnection.mockRejectedValue(new Error("database exploded"));

		const response = await GET(
			new Request("http://localhost/api/setup", {
				headers: {
					ID: "AA:BB:CC:DD:EE:FF",
					Model: "og_png",
				},
			}),
		);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			status: 500,
			error: "Internal server error",
		});
	});

	describe("when no owner can be resolved", () => {
		beforeEach(() => {
			checkDbConnection.mockResolvedValue({ ready: true });
			mockGetCurrentUserId.mockResolvedValue(null);
			mockWithDeviceApiKey.mockResolvedValue(undefined);
		});

		it("issues an API key so the device can reach /api/display and get a claim code", async () => {
			const response = await GET(
				setupRequest({
					ID: "aa:bb:cc:dd:ee:ff",
					Model: "xiao_epaper_display",
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.status).toBe(200);
			expect(typeof body.api_key).toBe("string");
			expect(body.api_key.length).toBeGreaterThan(0);
			expect(typeof body.friendly_id).toBe("string");
			expect(body.image_url).toBeNull();
		});

		it("does not create a device record before it is claimed", async () => {
			await GET(
				setupRequest({
					ID: "AA:BB:CC:DD:EE:FF",
					Model: "og_png",
				}),
			);

			expect(mockWithExplicitUserScope).not.toHaveBeenCalled();
		});

		it("keeps the Access-Token the device already holds", async () => {
			const response = await GET(
				setupRequest({
					ID: "AA:BB:CC:DD:EE:FF",
					Model: "og_png",
					"Access-Token": "device-held-key",
				}),
			);

			expect(response.status).toBe(200);
			expect((await response.json()).api_key).toBe("device-held-key");
		});

		it("still requires the ID and Model headers", async () => {
			const noModel = await GET(setupRequest({ ID: "AA:BB:CC:DD:EE:FF" }));
			expect(noModel.status).toBe(400);

			const noId = await GET(setupRequest({ Model: "og_png" }));
			expect(noId.status).toBe(400);
		});
	});
});
