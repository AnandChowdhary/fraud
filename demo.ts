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
files.create("user", <Data>{
  name: "Jane Doe",
  email: "jane@example.com",
  phone: {
    code: "+31",
    number: "9876543210"
  }
});
console.log("Created new file (user.json)");

// Reading a file
console.log("Name: " + files.read("user").name);

// Listing all files
console.log("List of files", files.list());

// Updating country code of Jane
console.log(
  "Updated country code",
  files.update("user", {
    phone: {
      code: "+1"
    }
  }).phone.code
);

// Deleting this file
console.log("Deleting file", files.delete("user"));
