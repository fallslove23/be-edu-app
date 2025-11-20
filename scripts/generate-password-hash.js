const bcrypt = require('bcryptjs');

const password = 'osstem';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Password hash for "osstem":');
  console.log(hash);
});
