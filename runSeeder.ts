import { readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Path to the seeder directory
const seederDir = join(__dirname, 'prisma', 'seeder');

// Read all TypeScript files from the seeder directory
const seedFiles = readdirSync(seederDir).filter((file) => file.endsWith('.ts'));

// Execute each seed file with ts-node
seedFiles.forEach((file) => {
  const filePath = join(seederDir, file);
  console.log(`Running seed file: ${filePath}`);
  execSync(`ts-node ${filePath}`, { stdio: 'inherit' });
});

console.log('Seeding completed!');
