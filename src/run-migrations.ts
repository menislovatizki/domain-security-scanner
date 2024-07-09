const { execSync } = require('child_process');
const path = require('path');

console.log('Starting migration process...');

try {
  // Change directory to the project root
  process.chdir(path.join(__dirname, '..'));

  // Run the migration
  execSync('npm run migration:run', { stdio: 'inherit' });

  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}