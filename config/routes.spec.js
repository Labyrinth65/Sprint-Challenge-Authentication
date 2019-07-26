const request = require("supertest");
const db = require("../database/dbConfig");

const server = require("../api/server");

describe("routes", () => {
	beforeEach(async () => {
		await db("users").truncate();
	});

	describe("register", () => {
		it("should increase total number of users", async () => {
			const startUsers = await db("users");
			await db("users").insert({
				username: "user",
				password: "pass"
			});
			const endUsers = await db("users");

			expect(endUsers).toHaveLength(startUsers.length + 1);
		});

		it("should return 201 for adding user", () => {
			const user = {
				username: "user1",
				password: "pass1"
			};

			return request(server)
				.post(`/api/register`)
				.send(user)
				.then(res => {
					expect(res.status).toBe(201);
				});
		});
	});
});
