import Fraud from "../index";
import ensure from "../ensure";

const database = new Fraud({
  directory: "./database",
  update: () => true
});

test("creates a file", () => {
  database.createSync("sample", { hello: "world" });
  expect(database.existsSync("sample")).toBeTruthy();
});

test("doesn't create a pre-existing file", () => {
  database.createSync("sample", { hello: "not-world" }, false);
  expect(database.readSync("sample").hello).toBe("world");
});

test("reads a file", () => {
  expect(database.readSync("sample").hello).toBe("world");
});

test("list gives an object", () => {
  expect(typeof database.listSync()).toBe("object");
});

test("list gives an array", () => {
  expect(Array.isArray(database.listSync())).toBeTruthy();
});

test("list should have at least one element", () => {
  database.createSync("another-sample", { world: "hello" });
  expect(database.listSync().length).toBeGreaterThanOrEqual(1);
});

test("deletes a file", () => {
  database.deleteSync("sample");
  expect(database.existsSync("sample")).toBeFalsy();
});

test("updates a file", () => {
  database.updateSync("another-sample", { world: "world" });
  expect(database.readSync("another-sample").world).toBe("world");
});

test("updates a file recursively", () => {
  database.createSync("yet-another-sample", { hello: { world: true } });
  database.updateSync("yet-another-sample", { hello: { world: false } });
  expect(database.readSync("yet-another-sample").hello.world).toBeFalsy();
});

test("update returns false on error", () => {
  expect(database.readSync("unknown-file")).toBeFalsy();
});

test("calls update function", () => {
  expect(database.callUpdate()).toBeTruthy();
});

test("ensures existance", () => {
  expect(ensure("unknown-folder")).toBeTruthy();
});
