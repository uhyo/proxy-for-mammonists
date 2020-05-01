const State = {
  Init: 0,
  Fragment: 1,
};

export class ResponseParser {
  constructor() {
    this.records = [];
    this.result = {
      type: 0,
      protocolVersion: "",
      length: 0,
      data: [],
    };
    this.state = state.Init;
    this.index = 0;
  }
  parse(buf) {
    const arr = [];
    if (this.state === this.state.Fragment) {
    }
    while (this.state === state.Init) {
      const win = buf.slice(this.index);
      // assuming this is the very beginning of this record
      if (win.length < 5) {
        throw new Error("TODO");
      }
      this.result.type = win[0];
      this.result.protocolVersion = String(win[1]) + "." + String(win[2]);
      this.result.length = win.readUInt16BE(3);
      if (win.length >= this.result.length + 5) {
        this.result.data.push(win.slice(5, 5 + this.result.length));
        this.index = this.result.length + 5;
        arr.push(this.result);
        this.result = {
          type: 0,
          protocolVersion: "",
          length: 0,
          data: [],
        };
      } else {
        this.state = state.Fragment;
        this.result.data.push(win.slice(5));
      }
    }
  }
}
