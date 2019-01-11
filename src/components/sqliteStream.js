const Readable = require('stream').Readable;
const Sqlite3 = require('better-sqlite3');

class SQLiteStream extends Readable {
  constructor(dbPath, sql) {
    super({ objectMode: true, autoDestroy: true });
    this._db = new Sqlite3(dbPath, { readonly: true });
    this._iterator = this._db.prepare(sql).iterate();
  }

  _read() {
    const elt = this._iterator.next();
    if(!this.push(!elt.done && elt.value ? elt.value : null)) {
      this._db.close();
    }
  }
}

module.exports = SQLiteStream;