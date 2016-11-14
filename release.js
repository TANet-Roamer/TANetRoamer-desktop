const fs = require('fs');

function changeName(name) {
  return name.replace(/ /g, '.').replace(/[\W]/g, '.').replace(/\.+/g, '.')
}

const base = 'dist/';
fs.readFile(base + 'latest.yml', {
  encoding: 'utf8'
}, (err, data) => {
  const
    raw = data.split('\n'),
    originName = raw[1].replace('path: ', ''),
    newName = changeName(originName);
  fs.rename(base + originName, base + newName, () => {
    raw[1] = 'path: ' + newName;
    const content = raw.join('\n');
    fs.writeFile(base + 'latest.yml', content, () => console.log(content));
  });
});
