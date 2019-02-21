import Fraud from "./index";

interface Data {
  name: string;
  email: string;
  phone: string;
}

const folder: string = "./database";

const files = new Fraud(folder);
console.log("Initialized folder", folder);

// Create a new files
files.create("user", <Data>{
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+31XXXXXXXXX"
});
console.log("Created new file");
