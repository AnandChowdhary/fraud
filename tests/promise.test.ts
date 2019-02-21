import Fraud from "../index";

const folder = () =>
  `sample-tests/test-${Math.random()
    .toString()
    .replace(".", "")}`;

test("creates a file", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.create("sample", { hello: "world" }))
    .then(() => database.exists("sample"))
    .then((value: boolean) => expect(value).toBeTruthy());
});

test("reads a file", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.create("sample", { hello: "world" }))
    .then(() => database.read("sample"))
    .then((value: any) => expect(value.hello).toBe("world"));
});

test("list should have one element", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.create("sample", { hello: "world" }))
    .then(() => database.list())
    .then((list: string[]) => expect(list.length).toBe(1));
});

test("deletes a file", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.create("sample", { hello: "world" }))
    .then(() => database.delete("sample"))
    .then(() => database.exists("sample"))
    .then((value: boolean) => expect(value).toBeFalsy());
});

test("updates a file", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.create("sample", { hello: "world" }))
    .then(() => database.update("sample", { hello: "not-world" }))
    .then(() => database.read("sample"))
    .then((value: any) => expect(value.hello).toBe("not-world"));
});

test("updates a file recursively", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.create("sample", { hello: { world: true } }))
    .then(() => database.update("sample", { hello: { world: false } }))
    .then(() => database.read("sample"))
    .then((value: any) => expect(value.hello.world).toBeFalsy());
});

test("read returns false on error", () => {
  const database = new Fraud({
    directory: folder()
  });
  database
    .init()
    .then(() => database.read("sample"))
    .catch((error: any) => expect(typeof error).toBe("object"));
});

test("update function is called", () => {
  const database = new Fraud({
    directory: folder(),
    update: () => true
  });
  database.init().then(() => expect(database.callUpdate()).toBeTruthy());
});
