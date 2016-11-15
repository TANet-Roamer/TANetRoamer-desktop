const packageJson = require('./app/package.json');
process.stdout.write('set APP_VERSION=' + packageJson.version + '\n' +
  'set RELEASE_VERSION=v' + packageJson.productShortName + '\n' +
  'set APP_SHORTNAME=' + packageJson.productShortName);
