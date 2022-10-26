import "dotenv/config";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { app } from "../src/app";

let api: request.SuperTest<request.Test>;
let databaseConn: Connection;

describe("Tests Controllers", () => {
  beforeAll(async () => {
    databaseConn = await createConnection();
    
    await databaseConn.dropDatabase();

    await databaseConn.runMigrations();

    api = request(app);
  });

  afterAll(async () => {
    await databaseConn.close();
  });

  describe("/api/v1/users", () => {
    it("Should be able to create a new user", async () => {
      const create = await api
        .post("/api/v1/users")
        .send({
          name: "User Test",
          password: "test123",
          email: "test@test.com"
        })
  
      expect(create.status).toBe(201);
    });
  });
  
  describe("/api/v1/sessions", () => {
    it("Should be able to authenticate a user", async () => {
      const result = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });
  
      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("token");
    });
  
    it("Should be able to authenticate an none existent user", async () => {
      const result = await api.post("/api/v1/sessions").send({
        email: "false@test.com",
        password: "test123",
      });
      expect(result.status).toBe(401);
    });
  
    it("Should be able to authenticate with incorrect password", async () => {
      const result = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "false",
      });
      expect(result.status).toBe(401);
    });
  });

  describe("/api/v1/profile", () => {
    it("Should be able to show user profile", async () => {
      const { body } = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });
  
      const { status, body: profile } = await api.get("/api/v1/profile").set({
        Authorization: `Bearer ${body.token}`,
      });

      expect(profile).toHaveProperty("id");
      expect(status).toBe(200);
    });
  });

  describe("/api/v1/statements/balance", () => {
    it("Should be able to show user balance", async () => {
      const { body } = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });
  
      const { status, body: balance } = await api
      .get("/api/v1/statements/balance").set({
        Authorization: `Bearer ${body.token}`,
      });

      expect(balance).toHaveProperty("balance");
      expect(balance).toHaveProperty("statement");
      expect(status).toBe(200);
    });
  });

  describe("/api/v1/statements/deposit", () => {
    it("Should be able to create a new deposit", async () => {
      const { body } = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });

      const { status, body: deposit } = await api
      .post("/api/v1/statements/deposit")
      .send({ 
        amount: 100,
        description: "Deposit description",
        user_id: body.user.id
       })
      .set({
        Authorization: `Bearer ${body.token}`,
      });

      expect(deposit).toHaveProperty("id");
      expect(status).toBe(201);
    });
  });

  describe("/api/v1/statements/withdraw", () => {
    it("Should be able to create a new withdraw", async () => {
      const { body } = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });

      const { status, body: withdraw } = await api
      .post("/api/v1/statements/withdraw")
      .send({ 
        amount: 90,
        description: "Withdraw description",
        user_id: body.user.id
       })
      .set({
        Authorization: `Bearer ${body.token}`,
      });

      expect(withdraw).toHaveProperty("id");
      expect(status).toBe(201);
    });

    it("Should not be able to create a withdraw with an insufficient balance", async () => {
      const { body } = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });

      const { status } = await api.post("/api/v1/statements/withdraw")
      .send({ 
        amount: 11,
        description: "Withdraw description",
        user_id: body.user.id
       })
      .set({
        Authorization: `Bearer ${body.token}`,
      });

      expect(status).toBe(400);
    });
  });

  describe("/api/v1/statements/:statement_id", () => {
    it("Should be able to listing a statement", async () => {
      const { body } = await api.post("/api/v1/sessions").send({
        email: "test@test.com",
        password: "test123",
      });
  
      const { body: balance } = await api.get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${body.token}`,
      });

      const statement = balance.statement[0];

      const { status, body: statements } = await api
      .get(`/api/v1/statements/${statement.id}`).set({
        Authorization: `Bearer ${body.token}`,
      });

      expect(statements).toHaveProperty("id");
      expect(statements).toHaveProperty("amount");
      expect(status).toBe(200);
    });
  })
});
