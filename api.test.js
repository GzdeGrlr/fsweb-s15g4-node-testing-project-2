const request = require("supertest");

const server = require("./api/server");
const db = require("./data/db-config");
const jwt = require("jsonwebtoken");
const secret = require("./api/secrets");

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db.seed.run();
});
afterAll(async () => {
  await db.destroy();
});

it("[0] sanity check", () => {
  expect(true).not.toBe(false);
});

it("[1] env ayarları doğru mu?", () => {
  expect(process.env.NODE_ENV).toBe("testing");
});

describe("[POST] api/auth/login", () => {
  it("[2] login oluyor mu?", async () => {
    const response = await request(server)
      .post("/api/auth/login")
      .send({ username: "bob", password: "1234" });
    expect(response.status).toBe(200);
  }, 1000);

  it("[3] hatalı bilgilerle login olmuyor", async () => {
    const response = await request(server)
      .post("/api/auth/login")
      .send({ username: "Harold", password: "123456" });
    expect(response.status).toBe(401);
  }, 1000);

  it("[4] doğru token var mı?", async () => {
    const res = await request(server)
      .post("/api/auth/login")
      .send({ username: "bob", password: "1234" });

    const token = res.body.token;
    let tokenUsername;

    const jwtDecoded = await jwt.verify(
      token,
      secret.JWT_SECRET,
      (err, decodedToken) => {
        tokenUsername = decodedToken.username;
      }
    );
    expect(tokenUsername).toBe("bob");
  }, 1000);
});

describe("[POST] auth/register", () => {
  it("[5] yeni kullanıcı adı istenilenlere uygun dönüyor", async () => {
    await request(server).post("/api/auth/register").send({
      username: "JohnReese",
      password: "123456",
      role_name: "Protector",
    });
    const newUser = await db("users").where("username", "JohnReese").first();
    expect(newUser.username).toBe("JohnReese");
  }, 1000);

  it("[6] 201 response dönüyor", async () => {
    const res = await request(server)
      .post("/api/auth/register")
      .send({ username: "Root", password: "1234" });
    expect(res.status).toBe(201);
  }, 1000);

  it("[7] role_name adminse hata mesaji dönüyor", async () => {
    let response = await request(server).post("/api/auth/register").send({
      username: "Shaw",
      password: "12344",
      role_name: "admin",
    });
    expect(response.body.message).toMatch(/admin olamaz/i);
  }, 1000);

  it("[8] role_name trimden sonra 32 karakterden fazlaysa 422 dönüyor", async () => {
    const res = await request(server).post("/api/auth/register").send({
      username: "Benjamin",
      password: "1234",
      role_name: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy",
    });
    expect(res.status).toBe(422);
  }, 1000);
  it("[8] role_name trimden sonra 32 karakterden fazlaysa doğru hata dönüyor", async () => {
    const res = await request(server).post("/api/auth/register").send({
      username: "Benjamin",
      password: "1234",
      role_name: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy",
    });
    expect(res.body.message).toMatch("rol adı 32 karakterden fazla olamaz");
  }, 1000);
});
