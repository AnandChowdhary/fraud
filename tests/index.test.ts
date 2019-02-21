import Fraud from "../index";
import ensure from "../ensure";

const database = new Fraud({
    directory: "./database",
    update: () => true
});

test("creates a file", () => {
    database.create("sample", { hello: "world" });
    expect(database.exists("sample")).toBeTruthy();
});

test("doesn't create a pre-existing file", () => {
    database.create("sample", { hello: "not-world" }, false);
    expect(database.read("sample").hello).toBe("world");
});

test("reads a file", () => {
    expect(database.read("sample").hello).toBe("world");
});

test("list gives an object", () => {
    expect(typeof database.list()).toBe("object");
});

test("list gives an array", () => {
    expect(Array.isArray(database.list())).toBeTruthy();
});

test("list should have at least one element", () => {
    database.create("another-sample", { world: "hello" });
    expect(database.list().length).toBeGreaterThanOrEqual(1);
});

test("deletes a file", () => {
    database.delete("sample");
    expect(database.exists("sample")).toBeFalsy();
});

test("updates a file", () => {
    database.update("another-sample", { world: "world" });
    expect(database.read("another-sample").world).toBe("world");
});

test("updates a file recursively", () => {
    database.create("yet-another-sample", { hello: { world: true } });
    database.update("yet-another-sample", { hello: { world: false } });
    expect(database.read("yet-another-sample").hello.world).toBeFalsy();
});

test("update returns false on error", () => {
    expect(database.read("unknown-file")).toBeFalsy();
});

test("calls update function", () => {
    expect(database.callUpdate()).toBeTruthy();
});

test("ensures existance", () => {
    expect(ensure("unknown-folder")).toBeTruthy();
});
