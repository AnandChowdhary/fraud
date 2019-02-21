import Fraud from "./index";

interface Data {
  name: string;
  email: string;
  phone: any;
}

const directory: string = "./database";

const files = new Fraud({
  directory
});
console.log("Initialized folder", directory);

// Create a new files
files
  .create("user", <Data>{
    name: "Jane Doe",
    email: "jane@example.com",
    phone: {
      code: "+31",
      number: "9876543210"
    }
  })
  .then(() => console.log("Created new file (user.json)"))
  .then(() => files.read("user"))
  .then((user: any) => console.log("Name: " + user.name))
  .then(() => files.list())
  .then(list => console.log("List of files", list))
  .then(() =>
    files.update("user", {
      phone: {
        code: "+1"
      }
    })
  )
  .then(() => console.log("Updated user"))
  .then(() => files.delete("user"))
  .then(() => console.log("Deleted file"))
  .catch(error => console.log("Error", error));
