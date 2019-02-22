# 🗄 Fraud

[![NPM](https://img.shields.io/npm/v/fraud.svg)](https://www.npmjs.com/package/fraud)
[![Build](https://img.shields.io/travis/AnandChowdhary/fraud.svg)](https://travis-ci.org/AnandChowdhary/fraud)
[![Coveralls](https://img.shields.io/coveralls/github/AnandChowdhary/fraud.svg)](https://coveralls.io/github/AnandChowdhary/fraud)
![Type definitions](https://img.shields.io/npm/types/fraud.svg?color=brightgreen)
[![GitHub](https://img.shields.io/github/license/anandchowdhary/fraud.svg)](https://github.com/AnandChowdhary/fraud/blob/master/LICENSE)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AnandChowdhary/fraud.svg)

Fraud is a promise-based library for Node.js for a file-system based data storage solution for times when MongoDB is an overkill. It's essentially a wrapper around the native `fs` filesystem functions, with added utilities.

## ⭐ How it works

Add fraud to your project with NPM:

```bash
npm install fraud
```

Add it to your project:

```js
const Fraud = require("fraud");
```

Initialize it with the directory of your database:

```js
const database = new Fraud({
    directory: "./database"
});
```

Now, you can use Fraud functions to use your file system as a JSON database. This is much faster then querying MongoDB in use cases where you only search for the primary key (in this case, the file name).

## 💡 Why Fraud

- No-config database for key-JSON storage
- As fast as your file system (low latency)

## 💻 Configuration

You can use the following options in the constructor:

```js
const database = new Fraud({
  directory: "./database", // Where files are stored
  extension: "json", // File extension for JSON files,
  update: info => { // Function to call when files are updated
      console.log(info);
  }
});
```

### Methods

You can use the following methods for programatical access:

| Method | Description |
| - | - |
| `create(fileName, object, overwrite?)` | Creates a new file |
| `delete(fileName)` | Deletes a file |
| `read(fileName)` | Reads a file |
| `readAll()` | Reads all files (3.0.0+) |
| `update(fileName, object)` | Patches a file |
| `list()` | Lists all available files |
| `exists(fileName)` | Returns whether file exists |

There are also `sync` versions of each function above (e.g., `createSync()`).

For example, you can create a new file like this:

```js
database.create("ara", {
    name: "Ara Isaacson",
    email: "hi@araassistant.com",
    phone: {
        countryCode: 31,
        number: "XXXXXXXXX"
    }
});
```

Then, updating a value is as simple as:

```js
database.update("ara", {
    phone: {
        countryCode: 1
    }
});
```

Which can be read like this:

```js
database.read("ara").then(user => console.log(user.phone));
// { countryCode: 1, number: "XXXXXXXXX" }
```

## 🛠️ Development

Start development server with Nodemon:

```bash
yarn start
```

### Production

Build a production version:

```bash
yarn build
```

## ✍️ Todo

- [x] Make it work
- [ ] Basic queries
- [ ] Save recent files in memory too (Redis?)

## 📝 License

MIT

Thanks to [@aleximb](https://github.com/aleximb) for suggesting the name!
