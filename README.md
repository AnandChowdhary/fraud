# 🗄 Fraud

[![NPM](https://img.shields.io/npm/v/fraud.svg)](https://www.npmjs.com/package/fraud)
[![Build](https://img.shields.io/travis/AnandChowdhary/fraud.svg)](https://travis-ci.org/AnandChowdhary/fraud)
[![Coveralls](https://img.shields.io/coveralls/github/AnandChowdhary/fraud.svg)](https://coveralls.io/github/AnandChowdhary/fraud)
![Type definitions](https://img.shields.io/npm/types/fraud.svg?color=brightgreen)
[![GitHub](https://img.shields.io/github/license/anandchowdhary/fraud.svg)](https://github.com/AnandChowdhary/fraud/blob/master/LICENSE)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AnandChowdhary/fraud.svg)

Fraud is a promise-based library for Node.js for a data storage solution for times when MongoDB is an overkill. It's essentially a wrapper around the native `fs` filesystem and [nodecache](https://github.com/mpneuried/nodecache), with added utilities.

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
- Caches everything in memory, uses file system if uncached
- Super fast and super low-latency

**Real use case:** Switching API configuration from MySQL (managed RDS in the same region as an EC2) to Fraud, [Oswald Labs Platform](https://oswaldlabs.com/platform/) was able to reduce event tracking latency from 100-150ms to 30-70ms.

### How it works

1. When you use `read(key)`, it queries in-memory cache
2. If found, returns it from the cache (super fast)
3. Otherwise, return it from the file system
4. Save it in cache, so future requests are from the cache

## 💻 Configuration

You can use the following options in the constructor:

```js
const database = new Fraud({
  directory: "./database", // Where files are stored
  extension: "json", // File extension for JSON files
  update: info => { // Function to call when files are updated
      console.log(info);
  },
  softDelete: false, // Set to true to not delete files, just rename and hide them,
  deletePrefix: "__deleted_", // If soft delete is enabled, use this prefix,
  stdTTL: 0, // Standard TTL number of seconds (0 is unlimited)
  checkperiod: 0 // Period in seconds to automatically perform delete check (0 is no check)
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
| `exists(fileName)` (note) | Returns whether file exists |
| `listCache()` | Lists all available cached files (5.0.0+) |

There are also `sync` versions of each function above (e.g., `createSync()`).

**Note:** It is better to use `read()` and catch a promise rejection than using `exists()`, because exists skips the cache and only checks the file system to make sure it's available. You should also be careful when using `readAll()` and `list()` for the same reason.

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

Or using async/await:

```js
const user = await database.read("ara");
console.log(user.phone);
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
- [x] Save recent files in memory too (~~Redis?~~ nodecache)

## 📝 License

MIT

Thanks to [@aleximb](https://github.com/aleximb) for suggesting the name!
