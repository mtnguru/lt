const s = {
  s: {
    s: "shit"   
  }
}

const str = JSON.stringify(s);
const t = JSON.parse(str);

console.log ("Dude " + s.s.s);
console.log ("Str " + str);
console.log ("Dude " + t.s.s);


